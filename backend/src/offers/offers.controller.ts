import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get('generate')
  async generateOffers(
    @Query('numCustomers') numCustomers: string,
    @Query('isFrequentGuest') isFrequentGuest: string,
  ) {
    const numCustomersInt = parseInt(numCustomers);
    const isFrequentGuestInt = parseInt(isFrequentGuest);

    if (isNaN(numCustomersInt) || isNaN(isFrequentGuestInt)) {
      throw new Error('numCustomers e isFrequentGuest deben ser números');
    }

    if (isFrequentGuestInt !== 0 && isFrequentGuestInt !== 1) {
      throw new Error('isFrequentGuest debe ser 0 o 1');
    }

    return await this.offersService.generateOffers(numCustomersInt, isFrequentGuestInt);
  }

  @Post('save-and-send')
async saveAndSendOffers(@Body() body: any) {
  console.log('Cuerpo completo recibido:', body); // Depuración
  const offersData = Array.isArray(body) ? body : body.offersData || [];
  const result = await this.offersService.saveAndSendOffers(offersData);

  if (result.emailErrors) {
    console.warn('Algunos correos no se pudieron enviar:', result.emailErrors);
  }

  return result.savedOffers;
}
}