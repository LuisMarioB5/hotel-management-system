import { Between, In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity, BookingStatus } from './booking.entity';
import { CreateBookingDTO } from './dtos/create.booking.dto';
import { UpdateBookingDTO } from './dtos/update.booking.dto';
import { CustomersService } from 'src/customers/customers.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomEntity, RoomStatus } from 'src/rooms/room.entity';
import { getEnumValues } from 'src/utils/showEnum.values';
import { MailerService } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HousekeepingService } from 'src/housekeeping/housekeeping.service';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly repository: Repository<BookingEntity>,
        private readonly customersService: CustomersService,
        private readonly roomsService: RoomsService,
        private readonly mailerService: MailerService,
        private readonly housekeepingService: HousekeepingService,
    ) {}

    async create(b: CreateBookingDTO): Promise<BookingEntity> {
        await this.isRoomAvailableWithException(b.roomId, b.checkInDate, b.checkOutDate);
        
        const newBooking: Partial<BookingEntity> = {
            customer: await this.customersService.findById(b.customerId),
            room: await this.roomsService.findById(b.roomId),
            checkInDate: b.checkInDate,
        };

        if (b.checkOutDate !== null) newBooking.checkOutDate = b.checkOutDate;
        if (b.details !== null) newBooking.details = b.details;
        if (b.cashAdvance !== null) newBooking.cashAdvance = b.cashAdvance;
        if (b.stayCost !== null) newBooking.stayCost = b.stayCost;
        if (b.totalStayDays !== null) newBooking.totalStayDays = b.totalStayDays;
        if (b.totalCost !== null) newBooking.totalCost = b.totalCost;
        if (b.priceAdjustment !== null) newBooking.priceAdjustment = b.priceAdjustment;
        if (b.status !== null) newBooking.status = b.status;
        if (b.isActive !== null) newBooking.isActive = b.isActive;

        const booking = this.repository.create(newBooking);
        const savedBooking = await this.repository.save(booking); // Guardamos la reserva inmediatamente
        return savedBooking;
    }

    async createAndNotify(bookingData: CreateBookingDTO, customerEmail: string, roomNumber: string): Promise<BookingEntity> {
        // Crear y guardar la reserva
        const savedBooking = await this.create(bookingData);

        try {
            // Enviar el correo de confirmación
            await this.sendBookingConfirmationEmail(savedBooking, customerEmail, roomNumber);
        } catch (error) {
            // Si el correo falla, eliminamos la reserva para mantener la consistencia
            await this.repository.delete(savedBooking.id);
            throw new Error(`Error al enviar el correo de confirmación: ${error.message}`);
        }

        return savedBooking;
    }

    async sendBookingConfirmationEmail(booking: BookingEntity, customerEmail: string, roomNumber: string) {
        try {
            const confirmUrl = `http://localhost:3000/bookings/confirm-from-email/${booking.id}`;
            const cancelUrl = `http://localhost:3000/bookings/cancel-from-email/${booking.id}`;
            const questionnaireUrl = `http://127.0.0.1:8080/frontend/src/pages/cuestionario.html`;

            // Obtener las amenidades de la habitación
            const roomAmenities = await this.roomsService.getRoomAmenities(booking.room.id);

            // Generar el HTML para las amenidades, agrupadas por categoría y
            // mostradas como chips (mismo lenguaje visual que el resto de la app)
            let amenitiesHtml = '';
            roomAmenities.forEach(category => {
                const groups = category.options.filter(option => option.amenities.length > 0);
                if (groups.length === 0) return;

                amenitiesHtml += `
                    <tr>
                        <td style="padding: 10px 0 4px;">
                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #8a4dff;">${category.name}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 0 6px;">
                `;
                groups.forEach(option => {
                    amenitiesHtml += `<span style="display: inline-block; margin: 0 6px 6px 0; padding: 5px 12px; border: 1px solid #e4e6ef; border-radius: 999px; background: #fbfbfe; font-size: 12px; font-weight: 600; color: #2d2f42;">${option.name}: ${option.amenities.map(a => a.value).join(', ')}</span>`;
                });
                amenitiesHtml += `
                        </td>
                    </tr>
                `;
            });

            // Si no hay amenidades, mostramos un mensaje
            if (!amenitiesHtml) {
                amenitiesHtml = '<tr><td style="color: #9a9fb5; font-size: 13px; padding: 8px 0;">Esta habitación no tiene amenidades adicionales registradas.</td></tr>';
            }

            const detailRow = (label: string, value: string) => `
                <tr>
                    <td style="padding: 6px 0; color: #8a8f9c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.02em; width: 40%;">${label}</td>
                    <td style="padding: 6px 0; color: #14162b; font-size: 14px; font-weight: 700;">${value}</td>
                </tr>
            `;

            await this.mailerService.sendMail({
                to: customerEmail,
                subject: 'Confirma tu Reserva en Hotel Hodelpa',
                html: `
                    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f5fa; padding: 24px 12px;">
                        <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(20,22,43,0.08);">
                            <img src="cid:hotel-image" alt="Hotel Hodelpa" style="width: 100%; max-height: 220px; object-fit: cover; display: block;" />
                            <div style="padding: 28px 32px;">
                                <h2 style="color: #14162b; text-align: center; margin: 0 0 4px; font-size: 22px;">¡Tu Reserva en Hotel Hodelpa!</h2>
                                <p style="color: #6b7085; text-align: center; margin: 0 0 24px; font-size: 14px;">Hemos recibido tu solicitud de reserva. Aquí están los detalles:</p>

                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #fbfbfe; border: 1px solid #eef0f7; border-radius: 12px; padding: 4px 16px; margin-bottom: 20px;">
                                    ${detailRow('Habitación', String(roomNumber))}
                                    ${detailRow('Fecha de entrada', new Date(booking.checkInDate).toLocaleDateString())}
                                    ${detailRow('Fecha de salida', new Date(booking.checkOutDate).toLocaleDateString())}
                                    ${detailRow('Costo total', `RD$${booking.totalCost.toLocaleString()}`)}
                                </table>

                                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #9a9fb5; margin-bottom: 6px;">Amenidades de la habitación</div>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    ${amenitiesHtml}
                                </table>

                                <p style="color: #4a4d63; text-align: center; font-size: 14px; margin: 0 0 12px;">Por favor, confirma o cancela tu reserva:</p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #2f6bff, #8a4dff); color: #fff; padding: 12px 26px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 0 6px;">Confirmar</a>
                                            <a href="${cancelUrl}" style="display: inline-block; background: #ca4754; color: #fff; padding: 12px 26px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 0 6px;">Cancelar</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #4a4d63; text-align: center; font-size: 14px; margin: 0 0 12px;">¿Quieres personalizar tu experiencia? Ingresa tus preferencias:</p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${questionnaireUrl}" style="display: inline-block; background: #ffffff; color: #8a4dff; border: 1.5px solid #8a4dff; padding: 10px 24px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">Ingresar Preferencias</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #9a9fb5; text-align: center; font-size: 12px; margin: 20px 0 0;">Si tienes alguna pregunta, no dudes en contactarnos.<br>Saludos, el equipo de Hotel Hodelpa</p>
                            </div>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: 'hotel-image.jpg',
                        path: join(__dirname, '..', '..', '..', 'frontend', 'public', 'assets', 'login-img.jpg'),
                        cid: 'hotel-image',
                    },
                ],
            });

            return { success: true };
        } catch (error) {
            throw new Error(`Error al enviar el correo de confirmación: ${error.message}`);
        }
    }

    async confirmBookingFromEmail(bookingId: number) {
        try {
            const booking = await this.repository.findOne({ where: { id: bookingId } });
            if (!booking) {
                throw new Error('Reserva no encontrada');
            }

            if (booking.status !== BookingStatus.PENDIENTE) {
                throw new Error('La reserva ya ha sido procesada');
            }

            booking.status = BookingStatus.CONFIRMADA;
            await this.repository.save(booking);

            return { success: true, message: 'Reserva confirmada exitosamente' };
        } catch (error) {
            throw new Error(`Error al confirmar la reserva: ${error.message}`);
        }
    }

    async cancelBookingFromEmail(bookingId: number) {
        try {
            const booking = await this.repository.findOne({ where: { id: bookingId } });
            if (!booking) {
                throw new Error('Reserva no encontrada');
            }

            if (booking.status !== BookingStatus.PENDIENTE) {
                throw new Error('La reserva ya ha sido procesada');
            }

            booking.status = BookingStatus.CANCELADA;
            booking.isActive = false;
            await this.repository.save(booking);

            return { success: true, message: 'Reserva cancelada exitosamente' };
        } catch (error) {
            throw new Error(`Error al cancelar la reserva: ${error.message}`);
        }
    }
    
    async findAll(): Promise<BookingEntity[]> {
        return this.repository.find({ relations: ['customer', 'room', 'consumptions'] });
    }

    async findById(id: number): Promise<BookingEntity> {
        const booking = await this.repository.findOne({ where: { id }, relations: ['customer', 'room', 'consumptions'] });
        if (!booking) this.throwBookingNotFoundException(id);
        return booking;
    }

    async update(id: number, b: UpdateBookingDTO): Promise<BookingEntity> {
        if(id === null) throw new BadRequestException('Debe suministrar el ID de la reserva a modificar.');
        const oldBooking = await this.findById(id);
        
        if(b.roomId !== null && b.roomId !== undefined) {
            const room: RoomEntity = await this.roomsService.findById(b.roomId);
            oldBooking.room = room;
        }

        if(b.checkInDate !== null) oldBooking.checkInDate = b.checkInDate;
        if(b.checkOutDate !== null) oldBooking.checkOutDate = b.checkOutDate;
        if(b.actualCheckInDate !== null) oldBooking.actualCheckInDate = b.actualCheckInDate;
        if(b.actualCheckOutDate !== null) oldBooking.actualCheckOutDate = b.actualCheckOutDate;
        if(b.details !== null) oldBooking.details = b.details;
        if(b.cashAdvance !== null) oldBooking.cashAdvance = b.cashAdvance;
        if(b.stayCost !== null) oldBooking.stayCost = b.stayCost;
        if(b.totalStayDays !== null) oldBooking.totalStayDays = b.totalStayDays;
        if(b.totalCost !== null) oldBooking.totalCost = b.totalCost;
        if(b.priceAdjustment !== null) oldBooking.priceAdjustment = b.priceAdjustment;
        if(b.status !== null) oldBooking.status = b.status;
        if(b.isActive !== null) oldBooking.isActive = b.isActive;

        await this.isRoomAvailableWithException(oldBooking.room.id, oldBooking.checkInDate, oldBooking.checkOutDate, oldBooking.id);

        const booking = await this.repository.save(oldBooking);
        return booking;
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
            this.throwBookingNotFoundException(id);
        }
    }
    
    getEnumValues() {
        return getEnumValues({ BookingStatus });
    }

    private throwBookingNotFoundException(id: number) {
        throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    async confirm(id: number): Promise<BookingEntity> {
        const booking = await this.findById(id);
        if (booking.status !== BookingStatus.PENDIENTE) {
            throw new BadRequestException('Solo las reservas pendientes pueden ser confirmadas.');
        }

        booking.status = BookingStatus.CONFIRMADA;
        return this.repository.save(booking);
    }

    async checkIn(id: number, createCheckInDTO: {cashAdvance: number}): Promise<BookingEntity> {
        const booking = await this.findById(id);
        if (booking.status !== BookingStatus.CONFIRMADA) {
            throw new BadRequestException('Solo las reservas confirmadas pueden realizar check-in.');
        }

        if (booking.room.status === RoomStatus.LIMPIEZA) {
            throw new BadRequestException('La habitación está en limpieza. Asigne otra habitación o espere a que termine');
        }

        if (booking.room.status === RoomStatus.FUERA_DE_SERVICIO) {
            throw new BadRequestException('La habitación está en fuera de servicio. Asigne otra habitación o espere a que termine');
        }

        if ((booking.cashAdvance <= 0 || booking.cashAdvance === null) || (createCheckInDTO.cashAdvance <= 0 || createCheckInDTO.cashAdvance === null)) {
            throw new BadRequestException('Se debe depositar un adelanto de efectivo para poder realizar el check-in');
        }

        await this.roomsService.updateRoomStatus(booking.room.id, RoomStatus.OCUPADA);
        booking.room.status = RoomStatus.OCUPADA;
        booking.actualCheckInDate = new Date();
        booking.cashAdvance = createCheckInDTO.cashAdvance;
        booking.status = BookingStatus.CHECKED_IN;

        return this.repository.save(booking);
    }

    async checkOut(id: number): Promise<BookingEntity> {
        const booking = await this.findById(id);
        if (booking.status !== BookingStatus.CHECKED_IN) {
            throw new BadRequestException('Solo las reservas en estado CHECKED_IN pueden realizar check-out.');
        }

        await this.roomsService.updateRoomStatus(booking.room.id, RoomStatus.LIMPIEZA);
        booking.room.status = RoomStatus.LIMPIEZA;
        booking.actualCheckOutDate = new Date();
        booking.status = BookingStatus.CHECKED_OUT;

        await this.housekeepingService.createCleaningTask(booking.room.id);

        return this.repository.save(booking);
    }

    async cancel(id: number): Promise<BookingEntity> {
        const booking = await this.findById(id);
        
        if (booking.status === BookingStatus.CHECKED_OUT) {
            throw new BadRequestException('No se puede cancelar una reserva ya finalizada.');
        }

        if (booking.status === BookingStatus.CONFIRMADA || booking.status === BookingStatus.CHECKED_IN) {
            await this.roomsService.updateRoomStatus(booking.room.id, RoomStatus.DISPONIBLE);
            booking.room.status = RoomStatus.DISPONIBLE;
        }
    
        booking.status = BookingStatus.CANCELADA;
        booking.isActive = false;
    
        return this.repository.save(booking);
    }

    async findAllAvailableRooms(checkInDate: Date, checkOutDate: Date): Promise<RoomEntity[]> {
        const rooms = await this.roomsService.findByStatus(RoomStatus.DISPONIBLE);
        const availableRooms: RoomEntity[] = [];
        for (const room of rooms) {
            const isAvailable = await this.isRoomAvailable(room.id, checkInDate, checkOutDate);
            if (isAvailable) {
                availableRooms.push(room);
            }
        }
    
        return availableRooms;
    }

    private async isRoomAvailable(roomId: number, checkInDate: Date, checkOutDate: Date, bookingId?: number): Promise<boolean> {
        const overlappingBookings = await this.repository.find({
            where: {
                room: { id: roomId },
                status: In([BookingStatus.CONFIRMADA, BookingStatus.PENDIENTE]),
                checkInDate: LessThanOrEqual(checkOutDate),
                checkOutDate: MoreThanOrEqual(checkInDate),
                ...(bookingId && { id: Not(bookingId) })
            },
        });
    
        return overlappingBookings.length === 0;
    }
    
    async findBookingsWithinDateRange(startDate: Date, endDate: Date): Promise<BookingEntity[]> {
        if (!startDate || !endDate) {
            throw new BadRequestException('El rango de fechas es obligatorio');
        }
    
        if (startDate > endDate) {
            throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
        } else if (endDate < startDate) {
            throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio');
        }
    
        const bookings = await this.repository.find({
            where: [
                {
                    checkInDate: LessThanOrEqual(endDate),
                    checkOutDate: MoreThanOrEqual(startDate),
                },
            ],
            relations: ['customer', 'room', 'consumptions'],
        });
    
        return bookings;
    }

    private async isRoomAvailableWithException(roomId: number, checkInDate: Date, checkOutDate: Date, bookingId?: number): Promise<void> {
        if (!await this.isRoomAvailable(roomId, checkInDate, checkOutDate, bookingId)) {
            throw new BadRequestException('La habitación ya tiene reservas en las fechas seleccionadas.');
        }
    }
    
    async desactiveBooking(id: number) {
        const booking = await this.findById(id);
        booking.isActive = false;
        return this.repository.save(booking);
    }

    async getReservationsByRoomAndDateRange(
        roomId: number | null,
        startDate: Date,
        endDate: Date,
    ): Promise<BookingEntity[]> {
        const where: Record<string, unknown> = {
            checkInDate: Between(startDate, endDate),
        };
        if (roomId !== null) {
            where.room = { id: roomId };
        }

        return this.repository.find({
            where,
            relations: ['room', 'customer', 'consumptions'],
        });
    }
}