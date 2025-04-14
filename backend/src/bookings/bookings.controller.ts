import { Controller, Post, Get, Param, Body, Patch, Delete, Query, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './booking.entity';
import { CreateBookingDTO } from './dtos/create.booking.dto';
import { UpdateBookingDTO } from './dtos/update.booking.dto';
import { RoomEntity } from 'src/rooms/room.entity';

@Controller('bookings')
export class BookingsController {
    constructor(private readonly service: BookingsService) {}

    @Post('register')
    async create(@Body() body: CreateBookingDTO): Promise<BookingEntity> {
        return this.service.create(body);
    }

    // Nuevo endpoint para crear una reserva y enviar el correo de notificación
    @Post('create-and-notify')
    async createAndNotify(@Body() body: any) {
        const { bookingData, customerEmail, roomNumber } = body;

        try {
            const savedBooking = await this.service.createAndNotify(bookingData, customerEmail, roomNumber);
            return { success: true, booking: savedBooking };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Endpoint para confirmar una reserva desde el enlace del correo
    @Get('confirm-from-email/:id')
    async confirmFromEmail(@Param('id') id: string) {
        try {
            const result = await this.service.confirmBookingFromEmail(parseInt(id));
            return `
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2>${result.message}</h2>
                        <p>Gracias por confirmar tu reserva en Hotel Hodelpa.</p>
                        <a href="http://localhost:3000" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Volver al sitio</a>
                    </body>
                </html>
            `;
        } catch (error) {
            return `
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2>Error</h2>
                        <p>${error.message}</p>
                        <a href="http://localhost:3000" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Volver al sitio</a>
                    </body>
                </html>
            `;
        }
    }

    // Endpoint para cancelar una reserva desde el enlace del correo
    @Get('cancel-from-email/:id')
    async cancelFromEmail(@Param('id') id: string) {
        try {
            const result = await this.service.cancelBookingFromEmail(parseInt(id));
            return `
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2>${result.message}</h2>
                        <p>Lamentamos que hayas cancelado tu reserva. Si necesitas ayuda, contáctanos.</p>
                        <a href="http://localhost:3000" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Volver al sitio</a>
                    </body>
                </html>
            `;
        } catch (error) {
            return `
                <html>
                    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                        <h2>Error</h2>
                        <p>${error.message}</p>
                        <a href="http://localhost:3000" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Volver al sitio</a>
                    </body>
                </html>
            `;
        }
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

    @Delete(':id')
    async delete(@Param('id') id: number) {
        await this.service.delete(id);
        return { message: `Reserva con ID ${id} eliminada exitosamente` }
    }

    @Get('enums/values')
    getEnumValues() {
        return this.service.getEnumValues();
    }

    @Patch(':id/confirm')
    async confirm(@Param('id') id: number): Promise<BookingEntity> {
        return this.service.confirm(id);
    }
    
    @Patch(':id/check-in')
    async checkIn(@Param('id') id: number, @Body() checkInBody: {cashAdvance: number}): Promise<BookingEntity> {
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

    @Patch(':id/desactive')
    async bookingNotActive(@Param('id') id: number) {
        return await this.service.desactiveBooking(id);
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