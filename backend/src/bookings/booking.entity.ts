import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { RoomEntity } from '../rooms/room.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { InvoiceEntity } from 'src/billing/invoice.entity';

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

    @OneToMany(() => InvoiceEntity, (invoice) => invoice.bookings, { cascade: true })
    invoices: InvoiceEntity[];

    // Fechas planeadas de check-in y check-out
    @Column({ type: 'timestamp', nullable: false })
    checkInDate: Date;

    @Column({ type: 'timestamp', nullable: true, default: null })
    checkOutDate: Date;
    
    // Fecha y hora reales de check-in y check-out
    @Column({ type: 'timestamp', nullable: true, default: null })
    actualCheckInDate?: Date;

    @Column({ type: 'timestamp', nullable: true, default: null })
    actualCheckOutDate?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    cashAdvance?: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    stayCost: number;
    
    @Column({type: 'int', default: 1})
    totalStayDays: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalCost: number;

    @Column({ type: 'varchar', nullable: true, default: null })
    details: string;
    
    // Estado de la reserva usando enum para evitar errores
    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDIENTE })
    status: BookingStatus;
    
    // Campo para indicar si la reserva está activa o no
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}
