import { Module } from '@nestjs/common';
import { ConsumptionsController } from './consumptions.controller';
import { ConsumptionsService } from './consumptions.service';
import { ConsumptionEntity } from './consumption.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from 'src/products/products.module';
import { BookingsModule } from 'src/bookings/bookings.module';
import { CustomersModule } from 'src/customers/customers.module';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumptionEntity]),
    BookingsModule,
    ProductsModule,
    CustomersModule,
    RoomsModule,
  ],
  providers: [ConsumptionsService],
  exports: [ConsumptionsService],
  controllers: [ConsumptionsController],
})
export class ConsumptionsModule {}
