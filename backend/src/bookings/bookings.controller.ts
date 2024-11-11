import { Controller, Post, Get, Param, Body, Patch, Delete, Query, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './booking.entity';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { CreateCheckInDTO } from './dtos/create-checkin.dto';
import { RoomEntity } from 'src/rooms/room.entity';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly service: BookingsService) {}

    @Post('register')
    async create(@Body() body: CreateBookingDTO): Promise<BookingEntity> {
        return this.service.create(body);
    }

    @Get()
    async findAll(): Promise<BookingEntity[]> {
        return this.service.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.findById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() booking: UpdateBookingDTO) {
        return this.service.update(id, booking);
    }
    
    @Patch(':id/confirm')
    async confirm(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.confirm(id);
    }
    
    @Patch(':id/check-in')
    async checkIn(@Param('id') id: number, @Body() checkInBody: CreateCheckInDTO): Promise<BookingEntity> {
        return this.service.checkIn(id, checkInBody);
    }

    @Patch(':id/check-out')
    async checkOut(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.checkOut(id);
    }

    @Patch(':id/cancel')
    async cancel(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.cancel(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        await this.service.delete(id);
        return { message: `Reserva con ID ${id} eliminada exitosamente` }
    }

    
    @Get('rooms/available')
    async findAvailableRooms(
      @Query('checkInDate') checkInDate: string,
      @Query('checkOutDate') checkOutDate: string
    ): Promise<RoomEntity[]> {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
  
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
        throw new BadRequestException('Fechas de check-in y check-out inválidas.');
      }
  
      return this.service.findAllAvailableRooms(checkIn, checkOut);
    }
}
