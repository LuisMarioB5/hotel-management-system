import { In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingEntity, BookingStatus } from './booking.entity';
import { CreateBookingDTO } from './dtos/create-booking.dto';
import { CreateCheckInDTO } from './dtos/create-checkin.dto';
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
        this.verifyDatesAreFuture(b.checkInDate, b.checkOutDate);

        await this.isRoomAvailableWithException(b.roomId, b.checkInDate, b.checkOutDate);
        
        const booking = this.repository.create({
            customer: await this.customersService.findById(b.customerId),
            room: await this.roomsService.findById(b.roomId),
            checkInDate: b.checkInDate,
            checkOutDate: b.checkOutDate,
            details: b.details,
            status: BookingStatus.PENDIENTE,
            isActive: true
        });
        
        const saved = await this.repository.save(booking);
        await this.updateTotalStayCost(saved);
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

    async update(id: number, newBooking: UpdateBookingDTO): Promise<BookingEntity> {
        const oldBooking = await this.findById(id);
        
        if(newBooking.roomId) {
            const newRoom = await this.roomsService.findById(newBooking.roomId);
            oldBooking.room = newRoom;
        }

        if(newBooking.checkInDate) {
            oldBooking.checkInDate = newBooking.checkInDate;
        }

        if(newBooking.checkOutDate) {
            oldBooking.checkOutDate = newBooking.checkOutDate;
        }

        if(newBooking.details) {
            oldBooking.details = newBooking.details;
        }
    
        if (oldBooking.checkInDate && oldBooking.checkOutDate) {
            this.verifyDatesAreFuture(oldBooking.checkInDate, oldBooking.checkOutDate);
            await this.isRoomAvailableWithException(oldBooking.room.id, oldBooking.checkInDate, oldBooking.checkOutDate);
        }

        const b = await this.repository.save(oldBooking);
        await this.updateTotalStayCost(b);
        return b;
    }

    async confirm(id: number): Promise<BookingEntity> {
        const booking = await this.findById(id);
        if (booking.status !== BookingStatus.PENDIENTE) {
            throw new BadRequestException('Solo las reservas pendientes pueden ser confirmadas.');
        }

        booking.status = BookingStatus.CONFIRMADA;
        return this.repository.save(booking);
    }

    async checkIn(id: number, createCheckInDTO: CreateCheckInDTO): Promise<BookingEntity> {
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

        if (createCheckInDTO.cashAdvance <= 0 || createCheckInDTO.cashAdvance === null) {
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
        }
    
        booking.status = BookingStatus.CANCELADA;
        booking.isActive = false;
    
        return this.repository.save(booking);
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
          this.throwBookingNotFoundException(id);
        }
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

    async updateTotalStayCost(booking: BookingEntity): Promise<void> {    
        // Determinar la fecha de salida efectiva
        const checkInDate = booking.actualCheckInDate || booking.checkInDate;
        const checkOutDate = booking.actualCheckOutDate || booking.checkOutDate;
    
        // Normalizar las fechas a medianoche para evitar que las horas afecten el cálculo
        const checkInDateNormalized = new Date(checkInDate);
        checkInDateNormalized.setHours(0, 0, 0, 0); // Pone la hora en 00:00
    
        const checkOutDateNormalized = new Date(checkOutDate);
        checkOutDateNormalized.setHours(0, 0, 0, 0); // Pone la hora en 00:00
    
        // Calcular la duración en milisegundos
        const durationInMillis = checkOutDateNormalized.getTime() - checkInDateNormalized.getTime();
    
        // Calcular la duración en días (sin redondeo)
        let durationInDays = durationInMillis / (1000 * 60 * 60 * 24);
    
        // Si la duración es mayor a 0, agregamos 1 al valor de días
        if (durationInDays > 0) {
            durationInDays = Math.ceil(durationInDays) + 1;  // Sumar 1 si pasa de un día
        } else {
            durationInDays = 1; // Si la fecha de salida es el mismo día que la entrada, se cuenta como 1 día
        }

        // Asignar la duración calculada al booking
        booking.totalStayDays = durationInDays;
    
        // Costo por noche de la habitación
        const roomCostPerNight = booking.room.price;
    
        // Calcular el costo total de la habitación
        booking.stayCost = roomCostPerNight * durationInDays;
    
        // Calcular el total de consumos
        booking.totalConsumption = Array.isArray(booking.consumptions)
            ? booking.consumptions.reduce((acc, consumption) => acc + Number(consumption.subtotal), 0)
            : 0;
    
        // Cálculo del costo total de la estancia
        booking.totalCost = booking.stayCost + booking.totalConsumption;
    
        // Guardar los cambios en la base de datos
        await this.repository.save(booking);
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
        if (!await this.isRoomAvailable(roomId, checkInDate, checkOutDate)) {
            throw new BadRequestException('La habitación ya tiene reservas en las fechas seleccionadas.');
        }
    }
    
    private verifyDatesAreFuture(firstDate: Date, secondDate: Date) {
        const newFirstDate = new Date(firstDate);
        const newSecondDate = new Date(secondDate);
        const today = new Date();
    
        // Establecer la hora a 00:00:00 para comparar solo las fechas
        newFirstDate.setHours(0, 0, 0, 0);
        newSecondDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
    
        if (newFirstDate < today || newSecondDate <= newFirstDate) {
            throw new BadRequestException('Las fechas proporcionadas deben estar en el futuro y en un orden válido (la primera antes que la segunda).');
        }
    }

    async desactiveBooking(id: number) {
        const booking = await this.findById(id);
        booking.isActive = false;
        return this.repository.save(booking);
    }

    getEnumValues() {
        return getEnumValues({ BookingStatus });
    }

    private throwBookingNotFoundException(id: number) {
        throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
}
