// booking.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CustomerEntity } from '../customers/customer.entity';
import { RoomEntity } from '../rooms/room.entity';

@Entity('bookings')
export class BookingEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CustomerEntity, customer => customer.bookings, { nullable: false })
    customer: CustomerEntity;

    @ManyToOne(() => RoomEntity, room => room.bookings, { nullable: false })
    room: RoomEntity;

    @Column({ type: 'date' })
    checkInDate: Date;

    @Column({ type: 'date' })
    checkOutDate: Date;

    @Column({ default: "PENDIENTE" })
    status: string;

    @Column({ default: true })
    isActive: boolean;
}
