import { BookingEntity } from 'src/bookings/booking.entity';
import { CustomerEntity } from 'src/customers/customer.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { InvoiceItemEntity } from './invoice.item.entity';

export enum InvoiceType {
    CONTADO = 'CONTADO',
    CREDITO = 'CREDITO',
}

export enum PaymentStatus {
    PENDIENTE = 'PENDIENTE',
    PAGADA = 'PAGADA',
}

@Entity('invoices')
export class InvoiceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'create_at' })
    createdAt: Date;

    @ManyToOne(() => BookingEntity, booking => booking.invoices, { nullable: true })
    booking: BookingEntity;

    @ManyToOne(() => CustomerEntity, { nullable: true })
    customer: CustomerEntity;

    @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
    items: InvoiceItemEntity[];

    @Column({ type: 'enum', enum: InvoiceType, default: InvoiceType.CONTADO })
    invoiceType: InvoiceType;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDIENTE })
    paymentStatus: PaymentStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    total: number;

    @Column({ type: 'boolean', default: false })
    isDisable: boolean;
}