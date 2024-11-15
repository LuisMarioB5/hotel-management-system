import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { RoomEntity } from '../rooms/room.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';

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

    @OneToMany(() => ConsumptionEntity, consumption => consumption.booking, { cascade: true })
    consumptions: ConsumptionEntity[];

    // Fechas planeadas de check-in y check-out
    @Column({ type: 'timestamp' })
    checkInDate: Date;

    @Column({ type: 'timestamp' })
    checkOutDate?: Date;
    
    @Column({ type: 'varchar', nullable: true, default: null })
    details?: string;
    
    // Campo para indicar si la reserva está activa o no
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
    
    // Fecha y hora reales de check-in y check-out
    @Column({ type: 'timestamp', nullable: true })
    actualCheckInDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    actualCheckOutDate?: Date;

    @Column({ type: 'decimal', nullable: true})
    cashAdvance?: number;
    
    @Column({ type: 'decimal', default: 0})
    totalConsumption: number
    
    @Column({ type: 'decimal', default: 0})
    stayCost: number
    
    @Column({type: 'int', default: 1})
    totalStayDays: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalCost: number;

    // Estado de la reserva usando enum para evitar errores
    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDIENTE })
    status: BookingStatus;
}
