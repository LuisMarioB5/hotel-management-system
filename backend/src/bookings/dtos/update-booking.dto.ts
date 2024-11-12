import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDTO {
  @IsNumber()
  @IsOptional()
  roomId?: number;

  @IsDateString()
  @IsOptional()
  checkInDate?: Date;
  
  @IsDateString()
  @IsOptional()
  checkOutDate?: Date;
  
  @IsString()
  @IsOptional()
  details?: string;
}
