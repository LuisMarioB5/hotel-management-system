import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceType, PaymentStatus } from './invoice.entity';
import { InvoiceItemEntity, InvoiceItemType } from './invoice.item.entity';
import { CustomersService } from 'src/customers/customers.service';
import { BookingsService } from 'src/bookings/bookings.service';
import { CreateInvoiceDTO } from './dtos/create.invoice.dto';
import { UpdatePaymentStatusDTO } from './dtos/update.payment.status.dto';
import { getEnumValues } from 'src/utils/showEnum.values';
import { ConsumptionAvailability } from 'src/consumptions/consumption.entity';
import { ConsumptionsService } from 'src/consumptions/consumptions.service';

@Injectable()
export class InvoicesService {
    constructor(
        @InjectRepository(InvoiceEntity)
        private readonly invoiceRepository: Repository<InvoiceEntity>,
        @InjectRepository(InvoiceItemEntity)
        private readonly itemRepository: Repository<InvoiceItemEntity>,
        private readonly customersService: CustomersService,
        private readonly bookigsService: BookingsService,
        private readonly consumptionService: ConsumptionsService,
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

        const booking = bookingId ? await this.bookigsService.findById(bookingId) : null;
        const customer = customerId ? await this.customersService.findById(customerId) : null;

        if(customer && booking && booking.customer.id !== customer.id) {
            throw new BadRequestException('El cliente ingresado no es el mismo que tiene la reserva ingresada.');
        }

        const stayItem = booking ? this.createInvoiceItem({
            description: 'Costo de estandía',
            quantity: booking.totalStayDays,
            unitPrice: booking.room.price,
            subtotal: booking.totalStayDays * booking.room.price,
            date: booking.actualCheckOutDate || booking.checkOutDate,
            type: InvoiceItemType.ESTANCIA,
        }) : null;

        const consumptionItem = booking?.consumptions?.
        filter(consumption => consumption.availability === ConsumptionAvailability.PENDIENTE).
        map((consumption) =>{
            this.consumptionService.update(consumption.id, { availability: ConsumptionAvailability.PAGADO });
            return this.createInvoiceItem({
                description: `Consumo de ${consumption.product.name}`,
                quantity: consumption.quantity,
                unitPrice: consumption.unitPrice,
                subtotal: consumption.subtotal || this.calculateSubtotal(consumption.quantity, consumption.unitPrice) || 0,
                date: consumption.createdAt,
                type: InvoiceItemType.CONSUMO,
            })
        }) || [];

        const additionalItems = items?.map((item) => 
            this.createInvoiceItem({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal || this.calculateSubtotal(item.quantity, item.unitPrice) || 0,
                date: item.date,
                type: item.type || InvoiceItemType.PENALIDAD,
            }),
        ) || [];

        const newInvoice = this.invoiceRepository.create({
            booking,
            customer,
            invoiceType: invoiceType || InvoiceType.CONTADO,
            paymentStatus: paymentStatus || PaymentStatus.PAGADA,
            items: [stayItem, ...consumptionItem, ...additionalItems].filter(item => item !== null),
        });

        newInvoice.total = newInvoice.items.reduce((total, item) => total + item.subtotal, 0);

        return await this.invoiceRepository.save(newInvoice);
    }

    async updatePaymentStatus(id: number, paymentStatus: PaymentStatus): Promise<InvoiceEntity> {
        const invoice = await this.findById(id);
        invoice.paymentStatus = paymentStatus;
        return await this.invoiceRepository.save(invoice);
    }

    async disable(id: number): Promise<void> {
        const invoice = await this.findById(id);
        invoice.isDisable = true;
        await this.invoiceRepository.save(invoice);
    }

    getEnumValues() {
        return getEnumValues({ InvoiceType, PaymentStatus, InvoiceItemType });
    }

    handleInvoiceNotFound(id: number) {
        throw new NotFoundException(`Factura con ID ${id} no encontrada. Verifique el ID e intente nuevamente.`);
    }

    private calculateSubtotal(quantity: number, unitPrice: number): number {
        if (quantity <= 0 || unitPrice <= 0) {
            throw new BadRequestException('La cantidad y el precio deben ser positivos y mayores a cero.');
        }
        
        return quantity * unitPrice;
    }

    private createInvoiceItem(data: Partial<InvoiceItemEntity>) {
        return this.itemRepository.create({ ...data });
    }
}
