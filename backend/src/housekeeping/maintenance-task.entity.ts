import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { RoomEntity } from 'src/rooms/room.entity';
import { UserEntity } from 'src/users/user.entity';

export enum TaskType {
  LIMPIEZA = 'LIMPIEZA',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

export enum TaskPriority {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export enum TaskStatus {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

@Entity('maintenance_tasks')
export class MaintenanceTaskEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RoomEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity;

  @Column({ type: 'enum', enum: TaskType })
  type: TaskType;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIA })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDIENTE })
  status: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ManyToOne(() => UserEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  completedAt: Date;
}
