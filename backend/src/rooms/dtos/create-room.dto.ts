import { IsString, IsNotEmpty, IsBoolean, IsNumber, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { RoomFloor, RoomStatus, RoomType } from '../room.entity';

export class CreateRoomDTO {
  @IsNumber()
  @IsNotEmpty()
  number: number;

  @IsString()
  @IsOptional()
  details?: string;

  @IsEnum(RoomFloor, {
    message: 'El piso debe ser un valor válido (PRIMER, SEGUNDO, TERCER, CUARTO, QUINTO)',
  })
  @IsNotEmpty()
  floor: RoomFloor;

  @IsEnum(RoomType, {
    message: 'El tipo (categoria) debe ser un valor válido (INDIVIDUAL, DOBLE, TRIPLE, MATRIMONIAL)',
  })
  @IsNotEmpty()
  type: RoomType;

  @IsEnum(RoomStatus, {
    message: 'El estado debe ser un valor válido (DISPONIBLE, RESERVADA, OCUPADA, FUERA_DE_SERVICIO, LIMPIEZA, PENDIENTE_DE_CHECKOUT)',
  })
  @IsOptional()
  status?: RoomStatus;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  price: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
