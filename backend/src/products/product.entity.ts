import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  price: number;
  
  @Column()
  amount: number;

  @Column({ nullable: true, default: null })
  details: string;

  @Column({ default: true })
  isActive: boolean;
}
