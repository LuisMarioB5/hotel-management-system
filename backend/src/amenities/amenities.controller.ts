import { Controller, Get } from '@nestjs/common';
import { AmenitiesService } from './amenities.service';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('list')
  async listAmenities() {
    return await this.amenitiesService.listAmenities();
  }
}