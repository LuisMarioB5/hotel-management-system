import { IsString, IsNotEmpty, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
  
  @IsEnum(UserRole, {
    message: 'El rol debe ser un valor válido (ADMINISTRADOR, RECEPCIONISTA, GERENTE, MANTENIMIENTO)',
  })
  @IsNotEmpty()
  role: UserRole;

  @IsBoolean()
  isActive: boolean;
}
