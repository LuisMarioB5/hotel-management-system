import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  price: number;
  
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;
  
  @IsString()
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
