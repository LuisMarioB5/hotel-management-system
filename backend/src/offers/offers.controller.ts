import { Controller, Post, Body, BadRequestException, Get, Query } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post('generate')
  async generateOffers(
    @Body() body: { numCustomers: number; isFrequentGuest: number; specificCustomer: number },
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

    return await this.offersService.generateOffers(numCustomers, isFrequentGuest, specificCustomer);
  }

  @Post('send')
  async sendOffers(@Body() offersData: any[]) {
    const result = await this.offersService.saveAndSendOffers(offersData);
    return result;
  }

  @Get()
  async getAllOffers(
    @Query('dateFrom') dateFrom?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
  ) {
    // Validaciones
    if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      throw new BadRequestException('dateFrom debe tener el formato YYYY-MM-DD');
    }
    if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
      throw new BadRequestException('month debe ser un número entre 1 y 12');
    }
    if (status && !['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].includes(status)) {
      throw new BadRequestException('status debe ser PENDIENTE, ACEPTADA o RECHAZADA');
    }

    const filters = {
      dateFrom,
      month: month ? parseInt(month) : undefined,
      status,
    };

    return await this.offersService.getAllOffers(filters);
  }
}