import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { BookingStatus } from '../booking.entity';

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
  
  @IsDateString()
  @IsOptional()
  actualCheckInDate?: Date;
  
  @IsDateString()
  @IsOptional()
  actualCheckOutDate?: Date;
  
  @IsString()
  @IsOptional()
  details?: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  cashAdvance?: number;
  
  @IsNumber()
  @IsOptional()
  @IsPositive()
  stayCost?: number
  
  @IsNumber()
  @IsOptional()
  @IsPositive()
  totalStayDays?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  totalCost?: number;

  @IsEnum(BookingStatus, {
    message: "El estado de la reseva debe ser válido (PENDIENTE, CONFIRMADA, CHECKED_IN, CHECKED_OUT, CANCELADA)."
  })
  @IsOptional()
  status?: BookingStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
