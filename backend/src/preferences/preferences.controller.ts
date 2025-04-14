import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  @Post('save')
  async savePreferences(@Body() formData: any) {
    return this.service.savePreferences(formData);
  }

  @Get(':customerId')
  async getPreferences(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.getPreferences(customerId);
  }
}