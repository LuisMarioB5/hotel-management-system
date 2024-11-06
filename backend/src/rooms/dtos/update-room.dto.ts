import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateRoomDTO {
  @IsNumber()
  @IsOptional()
  number?: number;

  @IsString()
  @IsOptional()
  details?: string;
  
  @IsString()
  @IsOptional()
  floor: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
