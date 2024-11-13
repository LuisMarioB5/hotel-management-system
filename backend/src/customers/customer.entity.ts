import { BookingEntity } from 'src/bookings/booking.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';

export enum CustomerDocumentType {
  DNI = 'DNI',
  CEDULA = 'CEDULA',
  PASAPORTE = 'PASAPORTE',
}

export enum CustomerGender {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
}

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: CustomerDocumentType})
  documentType: CustomerDocumentType;

  @Column({ unique: true })
  documentNumber: string;

  @Column({ type: 'enum', enum: CustomerGender, nullable: true })
  gender: CustomerGender;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn()
  registrationDate: Date;

  @Column({ default: false, nullable: true })
  isFrequentGuest: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true, nullable: true })
  isActive: boolean;

  @OneToMany(() => BookingEntity, booking => booking.customer)
  bookings: BookingEntity[];
}
