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

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly repository: Repository<BookingEntity>,
        private readonly customersService: CustomersService,
        private readonly roomsService: RoomsService,
        private readonly mailerService: MailerService,
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
            const questionnaireUrl = `http://127.0.0.1:5500/frontend/src/pages/cuestionario.html`;

            // Obtener las amenidades de la habitación
            const roomAmenities = await this.roomsService.getRoomAmenities(booking.room.id);

            // Generar el HTML para las amenidades
            let amenitiesHtml = '';
            roomAmenities.forEach(category => {
                amenitiesHtml += `
                    <li style="margin-bottom: 10px;">
                        <strong>${category.name}</strong>
                        <ul style="list-style: none; padding-left: 20px;">
                `;
                category.options.forEach(option => {
                    if (option.amenities.length > 0) {
                        amenitiesHtml += `
                            <li>${option.name}</li>
                            <ul style="list-style: none; padding-left: 20px;">
                        `;
                        option.amenities.forEach(amenity => {
                            amenitiesHtml += `
                                <li>${amenity.value} (Disponibilidad: ${amenity.availability_level})</li>
                            `;
                        });
                        amenitiesHtml += `</ul>`;
                    }
                });
                amenitiesHtml += `
                        </ul>
                    </li>
                `;
            });

            // Si no hay amenidades, mostramos un mensaje
            if (!amenitiesHtml) {
                amenitiesHtml = '<li>No hay amenidades asociadas a esta habitación.</li>';
            }

            await this.mailerService.sendMail({
                to: customerEmail,
                subject: 'Confirma tu Reserva en Hotel Hodelpa',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <img src="cid:hotel-image" alt="Hotel Hodelpa" style="max-width: 300px; height: auto; border-radius: 10px; display: block; margin: 0 auto;" />
                        <h2 style="color: #333; text-align: center;">¡Tu Reserva en Hotel Hodelpa!</h2>
                        <p style="color: #555;">Hola,</p>
                        <p style="color: #555;">Hemos recibido tu solicitud de reserva. Aquí están los detalles:</p>
                        <h3 style="color: #333;">Detalles de la Reserva:</h3>
                        <ul style="color: #555; list-style: none; padding: 0;">
                            <li><strong>Habitación:</strong> ${roomNumber}</li>
                            <li><strong>Fecha de Entrada:</strong> ${new Date(booking.checkInDate).toLocaleDateString()}</li>
                            <li><strong>Fecha de Salida:</strong> ${new Date(booking.checkOutDate).toLocaleDateString()}</li>
                            <li><strong>Costo Total:</strong> RD$${booking.totalCost.toLocaleString()}</li>
                        </ul>
                        <h3 style="color: #333;">Amenidades de la Habitación:</h3>
                        <ul style="color: #555; list-style: none; padding: 0;">
                            ${amenitiesHtml}
                        </ul>
                        <p style="color: #555; text-align: center;">Por favor, confirma o cancela tu reserva haciendo clic en uno de los botones a continuación:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${confirmUrl}" style="background: linear-gradient(135deg, #488ada, #ab2497); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Confirmar</a>
                            <a href="${cancelUrl}" style="background-color: #ff3333; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Cancelar</a>
                        </div>
                        <p style="color: #555; text-align: center;">¿Quieres personalizar tu experiencia? Ingresa tus preferencias:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${questionnaireUrl}" style="background: linear-gradient(135deg, #48c9da, #24ab97); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ingresar Preferencias</a>
                        </div>
                        <p style="color: #555;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        <p style="color: #555;">Saludos,<br>El equipo de Hotel Hodelpa</p>
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
        
        if(b.roomId !== null) {
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
        roomId: number,
        startDate: Date,
        endDate: Date,
    ): Promise<BookingEntity[]> {
        const startdate = startDate;
        const enddate = endDate;

        return this.repository.find({
            where: {
                room: {id: roomId},
                checkInDate: Between(startdate, enddate)
            },
            relations: ['room', 'customer', 'consumptions'],
        });
    }
}