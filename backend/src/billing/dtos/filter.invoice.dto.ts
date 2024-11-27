import { IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { PaymentStatus, InvoiceType } from '../invoice.entity';

export class FilterInvoicesDTO {
    @IsOptional()
    @IsEnum(PaymentStatus, {
        message: 'El estado del pago de la factura debe ser un valor válido (PENDIENTE o PAGADA)',
    })
    paymentStatus?: PaymentStatus;

    @IsOptional()
    @IsEnum(InvoiceType, {
        message: 'El tipo de factura debe tener un valor válido (CONTADO o CREDITO)',
    })
    invoiceType?: InvoiceType;

    @IsOptional()
    @IsNumber()
    customerId?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;
    
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
