import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceType, PaymentStatus } from './invoice.entity';
import { InvoiceItemEntity } from './invoice.item.entity';
import { CustomersService } from 'src/customers/customers.service';
import { BookingsService } from 'dist/bookings/bookings.service';
import { CreateInvoiceDTO } from './dtos/create.invoice.dto';
import { UpdatePaymentStatusDTO } from './dtos/update.payment.status.dto';
import { getEnumValues } from 'src/utils/showEnum.values';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(InvoiceEntity)
        private readonly invoiceRepository: Repository<InvoiceEntity>,
        @InjectRepository(InvoiceItemEntity)
        private readonly itemRepository: Repository<InvoiceItemEntity>,
        private readonly customersService: CustomersService,
        private readonly bookigsService: BookingsService,
    ) {}

    async findAll(): Promise<InvoiceEntity[]> {
        return await this.invoiceRepository.find({
            relations: ['items', 'customer', 'booking'],
        });
    }

    async findById(id: number): Promise<InvoiceEntity> {
        const invoice = await this.invoiceRepository.findOne({
            where: { id },
            relations: ['items', 'customer', 'booking'],
        });
        if(!invoice) this.handleInvoiceNotFound(id);
        return invoice;
    }

    async create(invoiceDTO: CreateInvoiceDTO): Promise<InvoiceEntity> {
        const { bookingId, customerId, invoiceType, paymentStatus, items } = invoiceDTO;

        const booking = bookingId ? 
            await this.bookigsService.findById(bookingId) :
            null;
        
        const customer = customerId ?
            await this.customersService.findById(customerId) :
            null;
        
        if(booking && booking.customer.id !== customer.id) {
            throw new BadRequestException('El cliente ingresado no es el mismo que tiene la reserva ingresada.');
        }

        const newInvoice = this.invoiceRepository.create({
            booking,
            customer,
            invoiceType,
            paymentStatus: paymentStatus ?? PaymentStatus.PENDIENTE,
            items: items.map((item) => 
                this.itemRepository.create({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal ?? item.quantity * item.unitPrice ?? 0,
                    date: item.date,
                }),
            ),
        });

        newInvoice.total = newInvoice.items.reduce((total, item) => total + item.subtotal, 0);

        return await this.invoiceRepository.save(newInvoice);
    }

    async updatePaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<InvoiceEntity> {
        const invoice = await this.findById(id);
        invoice.paymentStatus = paymentStatus;
        return await this.invoiceRepository.save(invoice);
    }

    async delete(id: number): Promise<void> {
        const result = await this.invoiceRepository.delete(id);
        if(result.affected === 0) this.handleInvoiceNotFound(id);
    }

    getEnumValues() {
        return getEnumValues({ InvoiceType, PaymentStatus });
    }

    handleInvoiceNotFound(id: number) {
        throw new NotFoundException(`Factura con ID ${id} no encontrada. Verifique el ID e intente nuevamente.`);
    }
}
