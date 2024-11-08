import { BookingEntity } from 'src/bookings/booking.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

export enum RoomStatus {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADA = 'RESERVADA',
  OCUPADA = 'OCUPADA',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
  LIMPIEZA = 'LIMPIEZA',
}

export enum RoomFloor {
  PRIMER = 'PRIMER',
  SEGUNDO = 'SEGUNDO',
  TERCER = 'TERCER',
  CUARTO = 'CUARTO',
  QUINTO = 'QUINTO',
}

export enum RoomType {
  INDIVIDUAL = 'INDIVIDUAL',
  DOBLE = 'DOBLE',
  TRIPLE = 'TRIPLE',
  MATRIMONIAL = 'MATRIMONIAL',
}

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  number: number;

  @Column({ default: null })
  details: string;

  @Column({ type: 'enum', enum: RoomFloor })
  floor: RoomFloor;
  
  @Column({ type: 'enum', enum: RoomType })
  type: RoomType;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.DISPONIBLE })
  status: RoomStatus;

  @Column()
  price: number;

  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(() => BookingEntity, booking => booking.room)
  bookings: BookingEntity[];
}
