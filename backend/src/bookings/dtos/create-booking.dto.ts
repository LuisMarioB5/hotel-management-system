import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBookingDTO {
  @IsNumber()
  @IsNotEmpty()
  customerId: number;
  
  @IsNumber()
  @IsNotEmpty()
  roomId: number;
  
  @IsDateString()
  @IsNotEmpty()
  checkInDate: Date;
  
  @IsDateString()
  @IsNotEmpty()
  checkOutDate: Date;
  
  @IsString()
  @IsOptional()
  details?: string;
}
