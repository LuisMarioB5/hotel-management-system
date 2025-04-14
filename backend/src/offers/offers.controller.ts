import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
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
}