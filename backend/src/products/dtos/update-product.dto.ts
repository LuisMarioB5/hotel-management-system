import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ProductCategory } from "../product.entity";

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

  @IsEnum(ProductCategory,
    {
      message: 'La cagtegoria del producto debe ser un valor válido (PRODUCTO ó SERVICIO)'
    })
  @IsOptional()
  category?: ProductCategory;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
