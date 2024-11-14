import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { ProductCategory } from "../product.entity";

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  unitPrice: number;
  
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
  
  @IsString()
  @IsOptional()
  details?: string;

  @IsEnum(ProductCategory, 
    {
      message: 'La categoria del producto debe ser un valor válido (PRODUCTO ó SERVICIO)'
    })
  @IsOptional()
  category: ProductCategory;
  
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
