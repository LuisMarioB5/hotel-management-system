import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
  
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsBoolean()
  isActive: boolean;
}
