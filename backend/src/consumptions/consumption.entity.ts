import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductEntity } from "src/products/product.entity";
import { BookingEntity } from "src/bookings/booking.entity";

@Entity('consumptions')
export class ConsumptionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => BookingEntity, booking => booking.consumptions, { nullable: false })
    booking: BookingEntity;

    @ManyToOne(() => ProductEntity, { nullable: false })
    product: ProductEntity;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal' })
    unitPrice: number;

    @Column({ type: 'decimal' })
    subtotal: number
}