import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InvoiceEntity } from "./invoice.entity";

export enum InvoiceItemType {
    ESTANCIA = 'ESTANCIA',
    CONSUMO = 'CONSUMO',
    PENALIDAD = 'PENALIDAD',
}

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

    @Column({ type: 'enum', enum: InvoiceItemType, default: InvoiceItemType.PENALIDAD })
    type: InvoiceItemType;
    
    @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, { onDelete: 'CASCADE' })
    invoice: InvoiceEntity;
}