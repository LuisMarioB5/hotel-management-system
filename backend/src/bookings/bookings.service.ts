import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity } from './booking.entity';
import { Repository, ReturningStatementNotSupportedError } from 'typeorm';
import { CustomersService } from 'src/customers/customers.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { UpdateBookingDTO } from './dtos/update-booking.dto';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(BookingEntity)
        private readonly repository: Repository<BookingEntity>,
        private readonly customersService: CustomersService,
        private readonly roomsService: RoomsService,
    ) {}

    async create(b: CreateBookingDTO): Promise<BookingEntity> {
        const customer = await this.customersService.findById(b.customerId);
        const room = await this.roomsService.findById(b.roomId);

        const booking = this.repository.create({
            customer,
            room,
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            status: "CONFIRMADA",
            isActive: b.isActive,
        });

        return this.repository.save(booking);
    }

    async findAll(): Promise<BookingEntity[]> {
        return this.repository.find({ relations: ['customer', 'room'] });
    }

    async findById(id: number): Promise<BookingEntity> {
        const booking = await this.repository.findOne({ where: { id }, relations: ['customer', 'room'] });
        if (!booking) this.throwBookingNotFoundException(id);
        return booking;
    }
    
        async update(id: number, booking: UpdateBookingDTO): Promise<BookingEntity> {
            const newBooking = await this.findById(id);
            Object.assign(newBooking, booking);
            return this.repository.save(newBooking);
        }

    async cancel(id: number): Promise<BookingEntity> {
        const booking = await this.findById(id);
        booking.status = 'CANCELADA';
        booking.isActive = false;
        return this.repository.save(booking);
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
          this.throwBookingNotFoundException(id);
        }
    }

    private throwBookingNotFoundException(id: number) {
        throw new NotFoundException(`Reseva con ID ${id} no encontrada`);
    }
}
      