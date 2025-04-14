import { Controller, Post, Body, Get, Query, Param,BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('generate')
  async generateOffers(
    @Body()
    body: {
      numCustomers: number;
      isFrequentGuest: number;
      specificCustomer: number;
    },
  ) {
    const { numCustomers, isFrequentGuest, specificCustomer } = body;
    if (!Number.isInteger(numCustomers) || numCustomers < 0) {
      throw new BadRequestException('numCustomers debe ser un número entero no negativo');
    }
  
    if (isFrequentGuest !== 0 && isFrequentGuest !== 1) {
      throw new BadRequestException('isFrequentGuest debe ser 0 o 1');
    }
  
    if (!Number.isInteger(specificCustomer) || specificCustomer < 0) {
      throw new BadRequestException('specificCustomer debe ser un número entero no negativo');
    }
    return await this.offersService.generateOffers(
      numCustomers,
      isFrequentGuest,
      specificCustomer,
    );
  }

  @Get()
  async getAllOffers(
    @Query('dateFrom') dateFrom?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
  ) {
    const filters: {
      dateFrom?: string;
      month?: number;
      status?: string;
    } = {};

    if (dateFrom) filters.dateFrom = dateFrom;
    if (month) filters.month = parseInt(month);
    if (status) filters.status = status;

    return this.offersService.getAllOffers(filters);
  }

  @Post('send')
  async saveAndSendOffers(@Body() offersData: any[]) {
    return this.offersService.saveAndSendOffers(offersData);
  }

  @Post('respond')
  async respondToOffer(
    @Body()
    body: {
      offerId: number;
      action: string;
      checkInDate?: string;
      checkOutDate?: string;
    },
  ) {
    return this.offersService.respondToOffer(body);
  }

  @Get('respond-from-email/:offerId/:action')
  async respondFromEmail(
    @Param('offerId') offerId: string,
    @Param('action') action: string,
    @Query('checkInDate') checkInDate?: string,
    @Query('checkOutDate') checkOutDate?: string,
  ) {
    try {
      const result = await this.offersService.respondFromEmail(
        parseInt(offerId),
        action,
        checkInDate,
        checkOutDate,
      );

      const isAccepted = action === 'accept';
      return `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 50px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: #fff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                max-width: 500px;
                margin: 0 auto;
              }
              h2 {
                color: #333;
              }
              p {
                color: #555;
                margin: 10px 0;
              }
              .success-icon {
                font-size: 50px;
                color: #28a745;
                margin-bottom: 20px;
              }
              a {
                background: linear-gradient(135deg, #48c9da, #24ab97);
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin-top: 20px;
              }
              a:hover {
                opacity: 0.9;
              }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
          </head>
          <body>
            <div class="container">
              <i class="fas fa-check-circle success-icon"></i>
              <h2>${isAccepted ? '¡Oferta Aceptada!' : 'Oferta Rechazada'}</h2>
              <p>${result.message}</p>
              ${
                isAccepted
                  ? `
                    <p>Hemos creado tu reserva con éxito.</p>
                    <p>Recibirás un correo con todos los detalles de tu estancia.</p>
                    <p>¿Deseas personalizar tu experiencia? Haz clic a continuación:</p>
                  `
                  : `
                    <p>Gracias por tu respuesta.</p>
                    <p>Si cambias de opinión, puedes contactarnos para explorar otras opciones.</p>
                  `
              }
              <a href="http://127.0.0.1:5500/frontend/src/pages/cuestionario.html">
                ${isAccepted ? 'Ingresar Preferencias' : 'Ver Otras Ofertas'}
              </a>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      throw new Error(error.message); // Esto será manejado por el frontend
    }
  }
}