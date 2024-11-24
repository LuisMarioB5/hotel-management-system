import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductEntity } from "src/products/product.entity";
import { BookingEntity } from "src/bookings/booking.entity";

@Entity('consumptions')
export class ConsumptionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => BookingEntity, booking => booking.consumptions, { nullable: false })
    booking: BookingEntity;

    @ManyToOne(() => ProductEntity, { nullable: false, eager: true })
    product: ProductEntity;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;
}