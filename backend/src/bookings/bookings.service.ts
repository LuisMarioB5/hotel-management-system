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
import { start } from 'repl';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly repository: Repository<BookingEntity>,
        private readonly customersService: CustomersService,
        private readonly roomsService: RoomsService,
    ) {}

    async create(b: CreateBookingDTO): Promise<BookingEntity> {
        await this.isRoomAvailableWithException(b.roomId, b.checkInDate, b.checkOutDate);
        
        const oldBooking: Partial<BookingEntity> = {
            customer: await this.customersService.findById(b.customerId),
            room: await this.roomsService.findById(b.roomId),
            checkInDate: b.checkInDate,
        };

        if(b.checkOutDate !== null) oldBooking.checkOutDate = b.checkOutDate;
        if(b.details !== null) oldBooking.details = b.details;
        if(b.cashAdvance !== null) oldBooking.cashAdvance = b.cashAdvance;
        if(b.stayCost !== null) oldBooking.stayCost = b.stayCost;
        if(b.totalStayDays !== null) oldBooking.totalStayDays = b.totalStayDays;
        if(b.totalCost !== null) oldBooking.totalCost = b.totalCost;
        if(b.status !== null) oldBooking.status = b.status;
        if(b.isActive !== null) oldBooking.isActive = b.isActive;

        const booking = this.repository.create(oldBooking);
        
        const saved = await this.repository.save(booking);
        return saved;
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
