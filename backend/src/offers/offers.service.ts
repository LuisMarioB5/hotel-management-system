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

  async generateOffers(numCustomers: number, isFrequentGuest: number) {
    try {
      const [results] = await this.dataSource.query(
        'CALL GenerateRoomAssignments(?, ?)',
        [numCustomers, isFrequentGuest],
      );

      // Asegurarnos de que los resultados sean un array plano
      let offers = results;
      if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
        offers = results[0];
      }

      return offers;
    } catch (error) {
      throw new Error(`Error al generar ofertas: ${error.message}`);
    }
  }

  async saveAndSendOffers(offersData: any[]) {
    console.log('Datos recibidos en el backend:', offersData); // Depuración
  
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
  
      // Validar que los campos requeridos estén presentes
      if (!customer_id || !discount || !validFrom || !validTo || !status || !price || !email || !room_number) {
        console.error('Oferta incompleta:', offer);
        throw new Error('Faltan campos requeridos en una oferta');
      }
  
      try {
        // Guardar la oferta en la tabla offers
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
  
        console.log('Resultado de la consulta INSERT:', queryResult); // Depuración
  
        // En MySQL, el resultado de INSERT es un objeto ResultSetHeader
        const result = queryResult as any;
        const offerId = result.insertId;
        if (!offerId) {
          throw new Error('No se pudo obtener el ID de la oferta insertada');
        }
  
        savedOffers.push({ ...offer, id: offerId });
  
        // Intentar enviar el correo
        try {
          await this.mailerService.sendMail({
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
          });
          console.log(`Correo enviado exitosamente a ${email}`);
        } catch (emailError) {
          console.error(`Error al enviar correo a ${email}:`, emailError.message);
          emailErrors.push({ email, error: emailError.message });
        }
  
      } catch (error) {
        console.error('Error al procesar oferta:', error);
        throw new Error(`Error al guardar oferta: ${error.message}`);
      }
    }
  
    // Devolver las ofertas guardadas y los errores de correo (si los hay)
    return {
      savedOffers,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    };
  }
}