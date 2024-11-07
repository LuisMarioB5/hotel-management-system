import { BookingEntity } from 'src/bookings/booking.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column()
  documentType: string;

  @Column({ unique: true })
  documentNumber: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn()
  registrationDate: Date;

  @Column({ default: false })
  isFrequentGuest: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => BookingEntity, booking => booking.customer)
  bookings: BookingEntity[];
}
