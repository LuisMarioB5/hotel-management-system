import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CustomerDocumentType, CustomerGender } from '../customer.entity';

export class CreateCustomerDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(CustomerDocumentType, {
    message: 'El tipo de documento debe ser uno válido (DNI, CEDULA ó PASAPORTE)'
  })
  @IsNotEmpty()
  documentType: CustomerDocumentType;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsEnum(CustomerGender, {
    message: 'El género del cliente debe ser uno válido (MASCULINO ó FEMENINO)'
  })
  @IsOptional()
  gender?: CustomerGender;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  email: string;

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
