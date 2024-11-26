import { IsNumber, IsOptional, IsString } from 'class-validator';

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
    @IsString()
    date?: string;
}
