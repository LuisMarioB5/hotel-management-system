import { Module } from '@nestjs/common';
import { ConsumptionsService } from './consumptions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumptionEntity } from './consumption.entity';
import { BookingsService } from 'src/bookings/bookings.service';
import { ProductsService } from 'src/products/products.service';
import { ProductsModule } from 'src/products/products.module';
import { BookingsModule } from 'src/bookings/bookings.module';
import { ConsumptionsController } from './consumptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumptionEntity]),
    BookingsModule,
    ProductsModule,
  ],
  providers: [ConsumptionsService, BookingsService, ProductsService,],
  exports: [ConsumptionsService],
  controllers: [ConsumptionsController],
})
export class ConsumptionsModule {}
