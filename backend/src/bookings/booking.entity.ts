import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { RoomEntity } from '../rooms/room.entity';
import { IsOptional, IsPositive } from 'class-validator';

export enum BookingStatus {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',
    CANCELADA = 'CANCELADA',
}

@Entity('bookings')
export class BookingEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CustomerEntity, (customer) => customer.bookings, { nullable: false })
    customer: CustomerEntity;

    @ManyToOne(() => RoomEntity, (room) => room.bookings, { nullable: false })
    room: RoomEntity;

    // Fechas planeadas de check-in y check-out
    @Column({ type: 'timestamp' })
    checkInDate: Date;

    @Column({ type: 'timestamp' })
    checkOutDate?: Date;
    
    @Column({ default: null })
    @IsOptional()
    details?: string;
    
    // Campo para indicar si la reserva está activa o no
    @Column({ default: true })
    isActive: boolean;
    
    // Fecha y hora reales de check-in y check-out
    @Column({ type: 'timestamp', nullable: true })
    @IsOptional()
    actualCheckInDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    @IsOptional()
    actualCheckOutDate?: Date;

    @Column({ nullable: true})
    @IsOptional()
    @IsPositive()
    cashAdvance?: number;

    // Estado de la reserva usando enum para evitar errores
    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDIENTE })
    status: BookingStatus;
}
