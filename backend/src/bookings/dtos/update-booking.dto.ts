import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDTO {  
  @IsDateString()
  @IsOptional()
  checkInDate?: Date;
  
  @IsDateString()
  @IsOptional()
  checkOutDate?: Date;
  
  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  IsActive?: boolean;
}
