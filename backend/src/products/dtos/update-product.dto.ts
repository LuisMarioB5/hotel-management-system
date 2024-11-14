import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateProductDTO {
  @IsString()
  @IsOptional()
  name?: string;
  
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
  
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amount?: number;
  
  @IsString()
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
