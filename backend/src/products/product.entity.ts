import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

export enum ProductCategory {
  PRODUCTO = 'PRODUCTO',
  SERVICIO = 'SERVICIO',
}

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal' })
  unitPrice: number;
  
  @Column()
  quantity: number;

  @Column({ nullable: true, default: null })
  details: string;

  @Column({ type: 'enum', enum: ProductCategory, default: ProductCategory.PRODUCTO })
  category: ProductCategory;
  
  @Column({ default: true })
  isActive: boolean;
}
