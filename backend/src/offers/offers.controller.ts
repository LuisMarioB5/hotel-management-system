import { Controller, Post, Body, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('generate')
  async generateOffers(
    @Body('numCustomers') numCustomers: number,
    @Body('isFrequentGuest') isFrequentGuest: number,
    @Body('specificCustomer') specificCustomer: number,
    @Body('roomType') roomType: string,
    @Body('minStayDuration') minStayDuration: number,
    @Body('seasonName') seasonName: string,
  ) {
    // Ajustar la validación para permitir numCustomers = 0
    if (numCustomers === undefined || numCustomers === null || numCustomers < 0) {
      throw new BadRequestException('numCustomers debe ser un número mayor o igual a 0');
    }
    if (isFrequentGuest !== -1 && isFrequentGuest !== 0 && isFrequentGuest !== 1) {
      throw new BadRequestException('isFrequentGuest debe ser -1, 0 o 1');
    }
    if (specificCustomer < 0) {
      throw new BadRequestException('specificCustomer debe ser un número mayor o igual a 0');
    }
    if (minStayDuration && minStayDuration < 1) {
      throw new BadRequestException('minStayDuration debe ser un número mayor o igual a 1');
    }
    if (seasonName && !['Alta', 'Media', 'Baja'].includes(seasonName)) {
      throw new BadRequestException('seasonName debe ser Temporada Alta, Temporada Media o Temporada Baja');
    }

    return this.offersService.generateOffers(
      numCustomers,
      isFrequentGuest,
      specificCustomer,
      roomType || '',
      minStayDuration || 1,
      seasonName || '',
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
              <a href="http://127.0.0.1:8080/frontend/src/pages/cuestionario.html">
                ${isAccepted ? 'Ingresar Preferencias' : 'Ver Otras Ofertas'}
              </a>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
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
              .error-icon {
                font-size: 50px;
                color: #CA4754;
                margin-bottom: 20px;
              }
              a {
                background: linear-gradient(135deg, #488ada, #ab2497);
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
              <i class="fas fa-times-circle error-icon"></i>
              <h2>No se pudo procesar tu respuesta</h2>
              <p>${error.message}</p>
              <a href="http://localhost:3000">Volver al sitio</a>
            </div>
          </body>
        </html>
      `;
    }
  }
}