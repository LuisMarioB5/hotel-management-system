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
    PAGADO = 'PAGADO',
}

@Entity('invoices')
export class InvoiceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'issue_date' })
    issueDate: Date;

    @ManyToOne(() => BookingEntity, (booking) => booking.invoices, { nullable: true })
    bookings: BookingEntity;

    @ManyToOne(() => CustomerEntity, { nullable: false })
    customer: CustomerEntity;

    @Column({ type: 'enum', enum: InvoiceType })
    invoiceType: InvoiceType;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDIENTE })
    paymentStatus: PaymentStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0})
    total: number;

    @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
    items: InvoiceItemEntity[];
}