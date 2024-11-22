import { In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity, BookingStatus } from './booking.entity';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';
import { CustomersService } from 'src/customers/customers.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { RoomEntity, RoomStatus } from 'src/rooms/room.entity';
import { getEnumValues } from 'src/utils/showEnum.values';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly repository: Repository<BookingEntity>,
        private readonly customersService: CustomersService,
        private readonly roomsService: RoomsService,
    ) {}

    async create(b: CreateBookingDTO): Promise<BookingEntity> {
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
        if(id === null) throw new BadRequestException();
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
}
