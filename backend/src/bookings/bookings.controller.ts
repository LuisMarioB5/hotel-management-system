import { Controller, Post, Get, Param, Body, Patch, Delete } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './booking.entity';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';

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

    @Patch(':id/cancel')
    async cancel(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.cancel(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        await this.service.delete(id);
        return { message: `Reserva con ID ${id} eliminada exitosamente` }
    }
}
