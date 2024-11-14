import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateProductDTO {
  @IsString()
  @IsOptional()
  name?: string;
  
  @IsNumber()
  @IsPositive()
  @IsOptional()
  unitPrice?: number;
  
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;
  
  @IsString()
  @IsOptional()
  details?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
