import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InvoiceEntity } from "./invoice.entity";

@Entity('invoice_items')
export class InvoiceItemEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    description: string;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'date' })
    date: Date;

    @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, { onDelete: 'CASCADE' })
    invoice: InvoiceEntity;
}