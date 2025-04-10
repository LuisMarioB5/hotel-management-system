import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm';
import { CustomerEntity } from './customers/customer.entity';
import { RoomEntity } from './rooms/room.entity';

// Entidad para amenity_categories
@Entity('amenity_categories')
export class AmenityCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: false, unique: true })
  name: string;
}

// Entidad para amenities
@Entity('amenities')
export class AmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'int', nullable: false })
  id_category: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  cost: number;

  @ManyToOne(() => AmenityCategoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_category' })
  category: AmenityCategoryEntity;
}

// Índice para amenities
@Index('idx_amenities_category', ['id_category'])
export class AmenityWithIndex {}

// Entidad para tech_amenities
@Entity('tech_amenities')
export class TechAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  speed: number; // Velocidad en Mbps (para Wi-Fi)

  @Column({ type: 'int', nullable: true })
  size: number; // Tamaño en pulgadas (para TV)

  @Column({ type: 'enum', enum: ['WIFI', 'TV', 'DISPOSITIVO_INTELIGENTE'], nullable: false })
  type: string;

  @OneToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  amenity: AmenityEntity;
}

// Entidad para food_amenities
@Entity('food_amenities')
export class FoodAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['CONTINENTAL', 'BUFFET', 'VEGANO', 'GOURMET', 'SIN_DESAYUNO'], nullable: false })
  type: string;

  @OneToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  amenity: AmenityEntity;
}

// Entidad para luxury_amenities
@Entity('luxury_amenities')
export class LuxuryAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  capacity: number; // Capacidad de personas (para jacuzzi)

  @Column({ type: 'boolean', nullable: true })
  has_view: boolean; // Indica si tiene vista (para balcón)

  @Column({ type: 'enum', enum: ['Interior', 'Exterior'], nullable: true })
  location: string;

  @OneToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  amenity: AmenityEntity;
}

// Entidad para service_amenities
@Entity('service_amenities')
export class ServiceAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['ALTA', 'MEDIA', 'BAJA'], nullable: false })
  level: string;

  @OneToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  amenity: AmenityEntity;
}

// Entidad para view_amenities
@Entity('view_amenities')
export class ViewAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['MAR', 'MONTAÑA', 'PISCINA', 'CALLE', 'INTERIOR'], nullable: false })
  type: string;

  @OneToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  amenity: AmenityEntity;
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

  @Column({ type: 'int', default: 1 })
  level: number; // Calidad de la comodidad en la habitación

  @ManyToOne(() => RoomEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  @ManyToOne(() => AmenityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: AmenityEntity;
}

// Entidad para client_amenities
@Entity('client_amenities')
@Index('idx_client_amenities_customer', ['customer_id'])
export class ClientAmenityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  customer_id: number;

  @Column({ type: 'int', nullable: false })
  amenity_id: number;

  @Column({ type: 'int', default: 1 })
  preference_level: number; // Nivel de preferencia

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

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