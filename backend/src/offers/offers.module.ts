import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([])], // No necesitamos entidades por ahora
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}