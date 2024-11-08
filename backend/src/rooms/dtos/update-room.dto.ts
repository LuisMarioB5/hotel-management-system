import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { RoomFloor, RoomStatus, RoomType } from '../room.entity';

export class UpdateRoomDTO {
  @IsNumber()
  @IsOptional()
  number?: number;

  @IsString()
  @IsOptional()
  details?: string;
  
  @IsEnum(RoomFloor, {
    message: 'El piso debe ser un valor válido (PRIMER, SEGUNDO, TERCER, CUARTO, QUINTO)',
  })
  @IsOptional()
  floor?: RoomFloor;

  @IsEnum(RoomType, {
    message: 'El tipo (categoria) debe ser un valor válido (INDIVIDUAL, DOBLE, TRIPLE, MATRIMONIAL)',
  })
  @IsOptional()
  type?: RoomType;

  @IsEnum(RoomStatus, {
    message: 'El estado debe ser un valor válido (DISPONIBLE, RESERVADA, OCUPADA, FUERA_DE_SERVICIO, LIMPIEZA, PENDIENTE_DE_CHECKOUT)',
  })
  @IsOptional()
  status?: RoomStatus;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
