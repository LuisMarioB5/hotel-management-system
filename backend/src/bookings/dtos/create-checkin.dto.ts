import { IsDateString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateCheckInDTO { 
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  cashAdvance: number;
}
