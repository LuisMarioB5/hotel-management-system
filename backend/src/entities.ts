import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm';
import { CustomerEntity } from './customers/customer.entity';
import { RoomEntity } from './rooms/room.entity';

// Entidad para amenity_categories
@Entity('amenity_categories')
export class AmenityCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name: string;
}

// Entidad para amenity_options
@Entity('amenity_options')
export class AmenityOptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  id_category: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @ManyToOne(() => AmenityCategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_category' })
  category: AmenityCategoryEntity;
}

// Entidad para amenities
@Entity('amenities')
export class AmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  amenity_option_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  value: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  cost: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @ManyToOne(() => AmenityOptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_option_id' })
  amenityOption: AmenityOptionEntity;
}

// Entidad para room_amenities
@Entity('room_amenities')
export class RoomAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  room_id: number;

  @Column({ type: 'int', nullable: false })
  amenity_id: number;

  @Column({ type: 'tinyint', default: 1 })
  availability_level: number;

  @ManyToOne(() => RoomEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  @ManyToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: AmenityEntity;
}

// Entidad para client_configuration
@Entity('client_configuration')
export class ClientConfigurationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_client_configuration_customer', { unique: true })
  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  min_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  max_cost: number;

  @Column({ type: 'tinyint', nullable: false })
  weight_level: number;

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;
}

// Entidad para client_amenities
@Entity('client_amenities')
@Index('idx_client_amenities_customer_amenity', ['customer_id', 'amenity_id'], { unique: true }) // Clave única compuesta
export class ClientAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @Column({ type: 'int', nullable: false })
  amenity_id: number;

  @Column({ type: 'tinyint', default: 1 })
  preference_level: number;

  @ManyToOne(() => ClientConfigurationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'customer_id' })
  customerConfiguration: ClientConfigurationEntity;

  @ManyToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: AmenityEntity;
}

// Entidad para offers
@Entity('offers')
export class OfferEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @Column({ type: 'int', nullable: true })
  room_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  discount: number;

  @Column({ type: 'date', nullable: false })
  validFrom: Date;

  @Column({ type: 'date', nullable: false })
  validTo: Date;

  @Column({ type: 'enum', enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'], default: 'PENDIENTE' })
  status: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  price: number;

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @ManyToOne(() => RoomEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;
}