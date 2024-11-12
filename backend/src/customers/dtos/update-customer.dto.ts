import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerDocumentType, CustomerGender } from '../customer.entity';

export class UpdateCustomerDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(CustomerDocumentType, {
    message: 'El tipo de documento del cliente debe ser uno válido (DNI, CEDULA ó PASAPORTE)'
  })
  @IsOptional()
  documentType?: CustomerDocumentType;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsEnum(CustomerGender, {
    message: 'El género del cliente debe ser uno válido (MACULINO ó FEMENINO)'
  })
  @IsOptional()
  gender?: CustomerGender;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isFrequentGuest?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
