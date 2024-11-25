import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { BookingStatus } from '../booking.entity';

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
  @IsOptional()
  checkOutDate?: Date;
  
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
