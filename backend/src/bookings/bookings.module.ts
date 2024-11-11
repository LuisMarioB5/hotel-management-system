import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from './booking.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { RoomsModule } from 'src/rooms/rooms.module';
import { BookingsController } from './bookings.controller';
import { CustomerEntity } from 'src/customers/customer.entity';
import { RoomEntity } from 'src/rooms/room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, CustomerEntity, RoomEntity]),
    CustomersModule,
    RoomsModule,
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
