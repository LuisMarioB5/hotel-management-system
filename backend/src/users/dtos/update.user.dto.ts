import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'El rol debe ser un valor válido (ADMINISTRADOR, RECEPCIONISTA, GERENTE, MANTENIMIENTO)',
  })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
