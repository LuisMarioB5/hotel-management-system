import { IsEnum, IsNumber, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDTO } from './invoice.item.dto';
import { InvoiceType, PaymentStatus } from '../invoice.entity';

export class CreateInvoiceDTO {
    @IsOptional()
    @IsNumber()
    bookingId?: number;

    @IsOptional()
    @IsNumber()
    customerId?: number;

    @IsNotEmpty()
    @IsEnum(InvoiceType, {
        message: 'El tipo de factura debe tener un valor válido (CONTADO o CREDITO)',
    })
    invoiceType: InvoiceType;

    @IsOptional()
    @IsEnum(PaymentStatus, {
        message: 'El estado del pago de la factura debe ser un valor válido (PENDIENTE o PAGADA)',
    })
    paymentStatus?: PaymentStatus;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDTO)
    items: InvoiceItemDTO[];
}
