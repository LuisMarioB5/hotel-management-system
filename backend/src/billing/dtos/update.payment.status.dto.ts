import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentStatus } from '../invoice.entity';

export class UpdatePaymentStatusDTO {
    @IsNotEmpty()
    @IsEnum(PaymentStatus, {
        message: 'El estado del pago de la factura debe ser un valor válido (PENDIENTE o PAGADA)',
    })
    paymentStatus: PaymentStatus;
}
