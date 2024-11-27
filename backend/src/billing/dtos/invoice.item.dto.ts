import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { InvoiceItemType } from '../invoice.item.entity';

export class InvoiceItemDTO {
    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    unitPrice: number;

    @IsOptional()
    @IsNumber()
    subtotal?: number;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsOptional()
    @IsEnum(InvoiceItemType, {
        message: 'El tipo del item tiene que ser válido (CONSUMO, PENALIDAD, ESTANCIA)',
    })
    type: InvoiceItemType;
}
