import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { InvoiceItemType } from '../invoice.item.entity';

export class InvoiceItemDTO {
    @IsString()
    description: string;

    @IsNumber()
    quantity: number;

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
