import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  RECEPCIONISTA = 'RECEPCIONISTA',
  GERENTE = 'GERENTE',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.RECEPCIONISTA })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  lastFailedAttempt: Date;
}
