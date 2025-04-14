import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OffersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mailerService: MailerService,
  ) {}

  async generateOffers(numCustomers: number, isFrequentGuest: number, specificCustomer: number) {
    try {
      const [results] = await this.dataSource.query(
        'CALL GenerateRoomAssignments(?, ?, ?)',
        [numCustomers, isFrequentGuest, specificCustomer],
      );

      let offers = results;
      if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
        offers = results[0];
      }

      return offers;
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
      // Forzar la zona horaria de la sesión a UTC para evitar problemas
      await this.dataSource.query("SET time_zone = '+00:00';");
  
      const { dateFrom, month, status } = filters;
  
      // Construir la consulta base
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
  
      // Filtro por fecha exacta (validFrom)
      if (dateFrom) {
        const formattedDate = new Date(dateFrom);

        query += ` AND DATE(o.validFrom) = DATE(?)`;
        params.push(dateFrom);
      }
  
      // Filtro por mes (basado en validFrom)
      if (month) {
        query += ` AND MONTH(o.validFrom) = ?`;
        params.push(month);
      }
  
      // Filtro por estado
      if (status) {
        query += ` AND o.status = ?`;
        params.push(status);
      }
  
      
  
      const offers = await this.dataSource.query(query, params);
  
  
      return offers;
    } catch (error) {
      throw new Error(`Error al obtener las ofertas: ${error.message}`);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]) as Promise<T>;
  }

  private async retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('No se deberían alcanzar esta línea');
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

    // Validar que todas las ofertas tengan los campos requeridos
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

    // Guardar las ofertas en la base de datos
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

    // Enviar correos electrónicos
    const emailPromises = savedOffers.map(async (offer) => {
      const { email, room_number, details, price, discount, validFrom, validTo } = offer;

      try {
        await this.retry(
          () =>
            this.withTimeout(
              this.mailerService.sendMail({
                to: email,
                subject: '¡Tu Oferta Exclusiva en Hotel Hodelpa!',
                html: `
                  <h2>Hola,</h2>
                  <p>¡Tenemos una oferta especial para ti!</p>
                  <h3>Detalles de la Oferta:</h3>
                  <ul>
                    <li><strong>Habitación:</strong> ${room_number}</li>
                    <li><strong>Detalles:</strong> ${details}</li>
                    <li><strong>Precio:</strong> $${price} (Descuento: ${discount}%)</li>
                    <li><strong>Válida desde:</strong> ${validFrom}</li>
                    <li><strong>Válida hasta:</strong> ${validTo}</li>
                  </ul>
                  <p>¡Aprovecha esta oferta antes de que expire!</p>
                  <p>Saludos,<br>El equipo de Hotel Hodelpa</p>
                `,
              }),
              10000,
            ),
          2,
          2000,
        );
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