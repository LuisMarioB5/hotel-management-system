import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { RoomsService } from 'src/rooms/rooms.service';
import { CustomersService } from 'src/customers/customers.service';
import { join } from 'path';

@Injectable()
export class OffersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mailerService: MailerService,
    private readonly roomsService: RoomsService,
    private readonly customersService: CustomersService,
  ) {}

  async generateOffers(
    numCustomers: number,
    isFrequentGuest: number,
    specificCustomer: number,
    roomType: string = '',
    minStayDuration: number = 1,
    seasonName: string = '',
  ) {
    try {
     
      // Ejecutar el procedimiento almacenado
      const results = await this.dataSource.query(
        'CALL GenerateRoomAssignments(?, ?, ?, ?, ?, ?)',
        [numCustomers, isFrequentGuest, specificCustomer, roomType, minStayDuration, seasonName],
      );

      // Manejar los múltiples conjuntos de resultados
      let offers = [];
      let warningMessage = null;

      if (Array.isArray(results)) {
        // Buscar el conjunto de ofertas
        const offersResult = results.find(item => Array.isArray(item) && item.length > 0 && item[0].customer_id);
        if (offersResult) {
          offers = offersResult;
        }

        // Buscar el WarningMessage: viene como su propio conjunto de
        // resultados (un arreglo con una sola fila), no como una propiedad
        // suelta del conjunto en sí.
        const warningResult = results.find(item => Array.isArray(item) && item.length > 0 && item[0].WarningMessage);
        if (warningResult) {
          warningMessage = warningResult[0].WarningMessage;
        }
      }

      // Retornar un objeto con las ofertas y el mensaje de advertencia
      return { offers, warningMessage };
    } catch (error) {
      throw new Error(`Error al generar ofertas: ${error.message}`);
    }
  }

  async getAllOffers(filters: {
    dateFrom?: string;
    month?: number;
    status?: string;
  }) {
    try {
      await this.dataSource.query("SET time_zone = '+00:00';");

      const { dateFrom, month, status } = filters;

      let query = `
        SELECT 
          o.id,
          o.customer_id,
          o.room_id,
          o.discount,
          o.validFrom,
          o.validTo,
          o.status,
          o.details,
          o.price,
          c.name AS customer_name,
          c.email AS customer_email,
          r.number AS room_number
        FROM offers o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN rooms r ON o.room_id = r.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (dateFrom) {
        const formattedDate = new Date(dateFrom);


        query += ` AND DATE(o.validFrom) = DATE(?)`;
        params.push(dateFrom);
      }

      if (month) {
        query += ` AND MONTH(o.validFrom) = ?`;
        params.push(month);
      }

      if (status) {
        query += ` AND o.status = ?`;
        params.push(status);
      }
      const offers = await this.dataSource.query(query, params);
      return offers.map(offer => ({
        ...offer,
        price: parseFloat(offer.price),
      }));
    } catch (error) {
      throw new Error(`Error al obtener las ofertas: ${error.message}`);
    }
  }

  async getOfferById(offerId: number) {
    try {
      const [offer] = await this.dataSource.query(
        `
        SELECT 
          o.id,
          o.customer_id,
          o.room_id,
          o.discount,
          o.validFrom,
          o.validTo,
          o.status,
          o.details,
          o.price,
          c.name AS customer_name,
          c.email AS customer_email,
          r.number AS room_number
        FROM offers o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN rooms r ON o.room_id = r.id
        WHERE o.id = ?
      `,
        [offerId],
      );

      if (offer) {
        offer.price = parseFloat(offer.price);
      }

      return offer;
    } catch (error) {
      throw new Error(`Error al obtener la oferta: ${error.message}`);
    }
  }

  async respondToOffer(data: {
    offerId: number;
    action: string;
    checkInDate?: string;
    checkOutDate?: string;
  }) {
    const { offerId, action, checkInDate, checkOutDate } = data;

    const offer = await this.getOfferById(offerId);
    if (!offer) {
      throw new Error('Oferta no encontrada');
    }

    if (offer.status !== 'PENDIENTE') {
      throw new Error('La oferta ya ha sido procesada');
    }

    if (offer.validTo && new Date(offer.validTo) < new Date(new Date().toDateString())) {
      throw new Error('Esta oferta ya venció y no se puede procesar');
    }

    const newStatus = action === 'accept' ? 'ACEPTADA' : 'RECHAZADA';
    await this.dataSource.query(
      `UPDATE offers SET status = ? WHERE id = ?`,
      [newStatus, offerId],
    );

    let message = `Oferta ${newStatus.toLowerCase()} exitosamente.`;
    if (action === 'accept') {
      if (!checkInDate || !checkOutDate) {
        await this.dataSource.query(
          `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
          [offerId],
        );
        throw new Error('Las fechas de entrada y salida son obligatorias para aceptar la oferta');
      }

      const overlappingBookings = await this.dataSource.query(
        `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE room_id = ?
        AND (
          (checkInDate <= ? AND checkOutDate >= ?) OR
          (checkInDate <= ? AND checkOutDate >= ?) OR
          (checkInDate >= ? AND checkOutDate <= ?)
        )
        AND status = 'CONFIRMADA'
      `,
        [
          offer.room_id,
          checkInDate,
          checkInDate,
          checkOutDate,
          checkOutDate,
          checkInDate,
          checkOutDate,
        ],
      );

      if (overlappingBookings[0].count > 0) {
        await this.dataSource.query(
          `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
          [offerId],
        );
        throw new Error('La habitación no está disponible en las fechas seleccionadas');
      }

      // Calcular los días totales de la estancia
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const totalStayDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (totalStayDays <= 0) {
        await this.dataSource.query(
          `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
          [offerId],
        );
        throw new Error('La fecha de salida debe ser posterior a la fecha de entrada');
      }

      // El precio base de la habitación es el precio de la oferta (por noche)
      const roomPricePerNight = offer.price;
      // Calcular el costo total: precio por noche * días de estancia
      const totalCost = roomPricePerNight * totalStayDays;

      const bookingResult = await this.dataSource.query(
        `
        INSERT INTO bookings (customer_id, room_id, checkInDate, checkOutDate, status, totalStayDays, totalCost)
        VALUES (?, ?, ?, ?, 'CONFIRMADA', ?, ?)
      `,
        [
          offer.customer_id,
          offer.room_id,
          checkInDate,
          checkOutDate,
          totalStayDays,
          totalCost,
        ],
      );

      const bookingId = bookingResult.insertId;
      if (!bookingId) {
        await this.dataSource.query(
          `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
          [offerId],
        );
        throw new Error('Error al crear la reserva');
      }

      message = 'Oferta aceptada y reserva creada exitosamente.';

      await this.sendBookingConfirmation({
        email: offer.customer_email,
        room_number: offer.room_number,
        details: offer.details,
        price: roomPricePerNight, // Precio por noche
        discount: offer.discount,
        checkInDate,
        checkOutDate,
        totalStayDays,
        totalCost,
        roomId: offer.room_id,
      });
    }

    return { success: true, message };
  }

  async respondFromEmail(offerId: number, action: string, checkInDate?: string, checkOutDate?: string) {
    try {
      const offer = await this.getOfferById(offerId);
      if (!offer) {
        throw new Error('Oferta no encontrada');
      }

      if (offer.status !== 'PENDIENTE') {
        throw new Error('La oferta ya ha sido procesada');
      }

      if (offer.validTo && new Date(offer.validTo) < new Date(new Date().toDateString())) {
        throw new Error('Esta oferta ya venció y no se puede procesar');
      }

      const newStatus = action === 'accept' ? 'ACEPTADA' : 'RECHAZADA';
      await this.dataSource.query(
        `UPDATE offers SET status = ? WHERE id = ?`,
        [newStatus, offerId],
      );

      if (action === 'accept') {
        if (!checkInDate || !checkOutDate) {
          await this.dataSource.query(
            `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
            [offerId],
          );
          throw new Error('Las fechas de entrada y salida son obligatorias para aceptar la oferta');
        }

        const overlappingBookings = await this.dataSource.query(
          `
          SELECT COUNT(*) as count
          FROM bookings
          WHERE room_id = ?
          AND (
            (checkInDate <= ? AND checkOutDate >= ?) OR
            (checkInDate <= ? AND checkOutDate >= ?) OR
            (checkInDate >= ? AND checkOutDate <= ?)
          )
          AND status = 'CONFIRMADA'
        `,
          [
            offer.room_id,
            checkInDate,
            checkInDate,
            checkOutDate,
            checkOutDate,
            checkInDate,
            checkOutDate,
          ],
        );

        if (overlappingBookings[0].count > 0) {
          await this.dataSource.query(
            `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
            [offerId],
          );
          throw new Error('La habitación no está disponible en las fechas seleccionadas');
        }

        // Calcular los días totales de la estancia
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const totalStayDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (totalStayDays <= 0) {
          await this.dataSource.query(
            `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
            [offerId],
          );
          throw new Error('La fecha de salida debe ser posterior a la fecha de entrada');
        }

        // El precio base de la habitación es el precio de la oferta (por noche)
        const roomPricePerNight = offer.price;
        // Calcular el costo total: precio por noche * días de estancia
        const totalCost = roomPricePerNight * totalStayDays;

        const bookingResult = await this.dataSource.query(
          `
          INSERT INTO bookings (customer_id, room_id, checkInDate, checkOutDate, status, totalStayDays, totalCost)
          VALUES (?, ?, ?, ?, 'CONFIRMADA', ?, ?)
        `,
          [
            offer.customer_id,
            offer.room_id,
            checkInDate,
            checkOutDate,
            totalStayDays,
            totalCost,
          ],
        );

        const bookingId = bookingResult.insertId;
        if (!bookingId) {
          await this.dataSource.query(
            `UPDATE offers SET status = 'PENDIENTE' WHERE id = ?`,
            [offerId],
          );
          throw new Error('Error al crear la reserva');
        }

        await this.sendBookingConfirmation({
          email: offer.customer_email,
          room_number: offer.room_number,
          details: offer.details,
          price: roomPricePerNight, // Precio por noche
          discount: offer.discount,
          checkInDate,
          checkOutDate,
          totalStayDays,
          totalCost,
          roomId: offer.room_id,
        });

        return { success: true, message: 'Oferta aceptada y reserva creada exitosamente' };
      }

      return { success: true, message: 'Oferta rechazada exitosamente' };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sendBookingConfirmation(data: {
    email: string;
    room_number: string;
    details: string;
    price: number;
    discount: number;
    checkInDate: string;
    checkOutDate: string;
    totalStayDays: number;
    totalCost: number;
    roomId: number;
  }) {
    const { email, room_number, details, price, discount, checkInDate, checkOutDate, totalStayDays, totalCost, roomId } = data;

    try {
      const questionnaireUrl = `http://127.0.0.1:8080/frontend/src/pages/cuestionario.html`;

      const roomAmenities = await this.roomsService.getRoomAmenities(roomId);

      let amenitiesHtml = '';
      if (roomAmenities && roomAmenities.length > 0) {
        roomAmenities.forEach(category => {
          amenitiesHtml += `
            <li style="margin-bottom: 10px;">
              <strong>${category.name}</strong>
              <ul style="list-style: none; padding-left: 20px;">
          `;
          category.options.forEach(option => {
            if (option.amenities.length > 0) {
              amenitiesHtml += `
                <li>${option.name}</li>
                <ul style="list-style: none; padding-left: 20px;">
              `;
              option.amenities.forEach(amenity => {
                amenitiesHtml += `
                  <li>${amenity.value} (Disponibilidad: ${amenity.availability_level})</li>
                `;
              });
              amenitiesHtml += `</ul>`;
            }
          });
          amenitiesHtml += `
              </ul>
            </li>
          `;
        });
      } else {
        amenitiesHtml = '<li>No hay amenidades asociadas a esta habitación.</li>';
      }

      await this.mailerService.sendMail({
        to: email,
        subject: 'Confirmación de tu Reserva en Hotel Hodelpa',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <img src="cid:hotel-image" alt="Hotel Hodelpa" style="max-width: 300px; height: auto; border-radius: 10px; display: block; margin: 0 auto;" />
            <h2 style="color: #333; text-align: center;">¡Tu Reserva en Hotel Hodelpa!</h2>
            <p style="color: #555;">Hola,</p>
            <p style="color: #555;">Gracias por aceptar tu oferta. Tu reserva ha sido confirmada con los siguientes detalles:</p>
            <h3 style="color: #333;">Detalles de la Reserva:</h3>
            <ul style="color: #555; list-style: none; padding: 0;">
              <li><strong>Habitación:</strong> ${room_number}</li>
              <li><strong>Detalles:</strong> ${details}</li>
              <li><strong>Precio por noche:</strong> RD$${price.toLocaleString()} (Descuento: ${discount}%)</li>
              <li><strong>Fecha de Entrada:</strong> ${new Date(checkInDate).toLocaleDateString()}</li>
              <li><strong>Fecha de Salida:</strong> ${new Date(checkOutDate).toLocaleDateString()}</li>
              <li><strong>Días de Estancia:</strong> ${totalStayDays}</li>
              <li><strong>Costo Total:</strong> RD$${totalCost.toLocaleString()}</li>
            </ul>
            <h3 style="color: #333;">Amenidades de la Habitación:</h3>
            <ul style="color: #555; list-style: none; padding: 0;">
              ${amenitiesHtml}
            </ul>
            <p style="color: #555; text-align: center;">¿Quieres personalizar tu experiencia? Ingresa tus preferencias:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${questionnaireUrl}" style="background: linear-gradient(135deg, #48c9da, #24ab97); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ingresar Preferencias</a>
            </div>
            <p style="color: #555;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p style="color: #555;">Saludos,<br>El equipo de Hotel Hodelpa</p>
          </div>
        `,
        attachments: [
          {
            filename: 'hotel-image.jpg',
            path: join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets', 'login-img.jpg'),
            cid: 'hotel-image',
          },
        ],
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Error al enviar el correo de confirmación: ${error.message}`);
    }
  }

  async saveAndSendOffers(offersData: any[]) {
    if (!Array.isArray(offersData)) {
      throw new Error('offersData debe ser un array');
    }

    if (offersData.length === 0) {
      throw new Error('No se recibieron ofertas para guardar');
    }

    const savedOffers = [];
    const emailErrors = [];

    for (const offer of offersData) {
      const {
        customer_id,
        room_id,
        discount,
        validFrom,
        validTo,
        status,
        details,
        price,
        email,
        room_number,
      } = offer;

      if (
        !customer_id ||
        !discount ||
        !validFrom ||
        !validTo ||
        !status ||
        !price ||
        !email ||
        !room_number
      ) {
        throw new Error(
          `Faltan campos requeridos en una oferta: ${JSON.stringify(offer)}`,
        );
      }

      if (!['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].includes(status)) {
        throw new Error(`Estado inválido en la oferta: ${status}`);
      }
    }

    const savePromises = offersData.map(async (offer) => {
      const {
        customer_id,
        room_id,
        discount,
        validFrom,
        validTo,
        status,
        details,
        price,
      } = offer;

      try {
        const queryResult = await this.dataSource.query(
          `INSERT INTO offers (customer_id, room_id, discount, validFrom, validTo, status, details, price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customer_id,
            room_id,
            discount,
            validFrom,
            validTo,
            status,
            details,
            price,
          ],
        );

        const result = queryResult as any;
        const offerId = result.insertId;
        if (!offerId) {
          throw new Error('No se pudo obtener el ID de la oferta insertada');
        }

        return { ...offer, id: offerId };
      } catch (error) {
        throw new Error(`Error al guardar oferta: ${error.message}`);
      }
    });

    try {
      const savedResults = await Promise.all(savePromises);
      savedOffers.push(...savedResults);
    } catch (error) {
      throw new Error(`Error al guardar ofertas: ${error.message}`);
    }

    const emailPromises = savedOffers.map(async (offer) => {
      const { id, email, room_number, details, price, discount, validFrom, validTo, room_id } = offer;

      const acceptUrl = `http://127.0.0.1:8080/frontend/src/pages/confirm-offer.html?offerId=${id}&action=accept&validFrom=${validFrom}&validTo=${validTo}`;
      const rejectUrl = `http://127.0.0.1:8080/frontend/src/pages/confirm-offer.html?offerId=${id}&action=reject&validFrom=${validFrom}&validTo=${validTo}`;
      const questionnaireUrl = `http://127.0.0.1:8080/frontend/src/pages/cuestionario.html`;

      try {
        const roomAmenities = await this.roomsService.getRoomAmenities(room_id);

        let amenitiesHtml = '';
        if (roomAmenities && roomAmenities.length > 0) {
          roomAmenities.forEach(category => {
            amenitiesHtml += `
              <li style="margin-bottom: 10px;">
                <strong>${category.name}</strong>
                <ul style="list-style: none; padding-left: 20px;">
            `;
            category.options.forEach(option => {
              if (option.amenities.length > 0) {
                amenitiesHtml += `
                  <li>${option.name}</li>
                  <ul style="list-style: none; padding-left: 20px;">
                `;
                option.amenities.forEach(amenity => {
                  amenitiesHtml += `
                    <li>${amenity.value} (Disponibilidad: ${amenity.availability_level})</li>
                  `;
                });
                amenitiesHtml += `</ul>`;
              }
            });
            amenitiesHtml += `
                </ul>
              </li>
            `;
          });
        } else {
          amenitiesHtml = '<li>No hay amenidades asociadas a esta habitación.</li>';
        }

        await this.mailerService.sendMail({
          to: email,
          subject: '¡Tu Oferta Exclusiva en Hotel Hodelpa!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <img src="cid:hotel-image" alt="Hotel Hodelpa" style="max-width: 300px; height: auto; border-radius: 10px; display: block; margin: 0 auto;" />
              <h2 style="color: #333; text-align: center;">¡Tu Oferta en Hotel Hodelpa!</h2>
              <p style="color: #555;">Hola,</p>
              <p style="color: #555;">¡Tenemos una oferta especial para ti! Aquí están los detalles:</p>
              <h3 style="color: #333;">Detalles de la Oferta:</h3>
              <ul style="color: #555; list-style: none; padding: 0;">
                <li><strong>Habitación:</strong> ${room_number}</li>
                <li><strong>Detalles:</strong> ${details}</li>
                <li><strong>Precio:</strong> RD$${price.toLocaleString()} (Descuento: ${discount}%)</li>
                <li><strong>Válida desde:</strong> ${new Date(validFrom).toLocaleDateString()}</li>
                <li><strong>Válida hasta:</strong> ${new Date(validTo).toLocaleDateString()}</li>
              </ul>
              <h3 style="color: #333;">Amenidades de la Habitación:</h3>
              <ul style="color: #555; list-style: none; padding: 0;">
                ${amenitiesHtml}
              </ul>
              <p style="color: #555; text-align: center;">Por favor, acepta o rechaza tu oferta haciendo clic en uno de los botones a continuación:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${acceptUrl}" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Aceptar</a>
                <a href="${rejectUrl}" style="background-color: #ff3333; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rechazar</a>
              </div>
              <p style="color: #555; text-align: center;">¿Quieres personalizar tu experiencia? Ingresa tus preferencias:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${questionnaireUrl}" style="background: linear-gradient(135deg, #48c9da, #24ab97); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ingresar Preferencias</a>
              </div>
              <p style="color: #555;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p style="color: #555;">Saludos,<br>El equipo de Hotel Hodelpa</p>
            </div>
          `,
          attachments: [
            {
              filename: 'hotel-image.jpg',
              path: join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets', 'login-img.jpg'),
              cid: 'hotel-image',
            },
          ],
        });
      } catch (emailError) {
        emailErrors.push({ email, error: emailError.message });
      }
    });

    await Promise.all(emailPromises);

    return {
      savedOffers,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    };
  }
}