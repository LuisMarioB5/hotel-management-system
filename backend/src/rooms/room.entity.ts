import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  number: number;

  @Column()
  details: string;

  @Column()
  floor: string;
  
  @Column()
  type: string;

  @Column({ default: 'DISPONIBLE' })
  status: string;

  @Column()
  price: number;

  @Column({ default: true })
  isAvailable: boolean;
}
