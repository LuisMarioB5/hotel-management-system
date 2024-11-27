import { CustomerEntity } from 'src/customers/customer.entity';
import { InvoiceType, PaymentStatus } from '../invoice.entity';
import { InvoiceItemDTO } from './invoice.item.dto';
import { BookingEntity } from 'src/bookings/booking.entity';

export class InvoiceDetailDTO {
    id: number;
    invoiceType: InvoiceType;
    paymentStatus: PaymentStatus;
    total: number;
    createdAt: Date;
    customer: CustomerEntity;
    booking?: BookingEntity;
    items: InvoiceItemDTO[];
}
