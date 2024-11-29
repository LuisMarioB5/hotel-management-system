import { BadRequestException, Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity, InvoiceType, PaymentStatus } from './invoice.entity';
import { InvoiceItemEntity, InvoiceItemType } from './invoice.item.entity';
import { CustomersService } from 'src/customers/customers.service';
import { BookingsService } from 'src/bookings/bookings.service';
import { CreateInvoiceDTO } from './dtos/create.invoice.dto';
import { getEnumValues } from 'src/utils/showEnum.values';
import { ConsumptionAvailability } from 'src/consumptions/consumption.entity';
import { ConsumptionsService } from 'src/consumptions/consumptions.service';
import PDFDocument from 'pdfkit';
import { DateFormatter } from 'src/utils/date.formatter';

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

    async generateInvoicePDF(id: number): Promise<Buffer> {
        const invoice = await this.findById(id);
        
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => console.log(`PDF generado para factura ID ${id}`));
    
        // Encabezado
        doc.fontSize(18).text('HOTEL HODELPA', { align: 'center' });
        doc.text('Factura de Hospedaje', { align: 'center' });
        doc.fontSize(14).text(`${DateFormatter.getSimpleDatetime(new Date())}`, { align: 'center' });
        doc.moveDown();
        doc.text(`Factura No. ${invoice.id}`);
        doc.text(`Fecha de Emisión: ${DateFormatter.getSimpleDate(new Date(invoice.createdAt))}`);
        doc.text(`Tipo de Factura: ${invoice.invoiceType}`);
        doc.text(`Estado del Pago: ${invoice.paymentStatus}`);
        doc.moveDown();
        doc.text(`Cliente: ${invoice.customer?.name + invoice.customer?.lastName || 'Desconocido'}`);
        if (invoice.customer?.documentType && invoice.customer?.documentNumber) {
            doc.text(`Documento: ${invoice.customer.documentType} ${invoice.customer.documentNumber}`);
        }
        if (invoice.customer?.phoneNumber) doc.text(`Teléfono: ${invoice.customer.phoneNumber}`);
        if (invoice.customer?.email) doc.text(`Email: ${invoice.customer.email}`);
        doc.moveDown();
    
        // Información de la reserva, si aplica
        if (invoice.booking) {
          doc.text(`ID de Reserva: ${invoice.booking.id}`);
          doc.text(`Check-in: ${DateFormatter.getSimpleDate(invoice.booking.actualCheckInDate || invoice.booking.checkOutDate)}`);
          doc.text(`Check-out: ${DateFormatter.getSimpleDate(invoice.booking.actualCheckOutDate || invoice.booking.checkOutDate)}`);
          doc.text(`Habitación No. ${invoice.booking.room.number}`);
          if(!invoice.items) doc.text(`Costo de la Estancia: $${Number(invoice.booking.stayCost).toFixed(2)}`);
          doc.moveDown();
        }
        
        const x = doc.x;
        let currentY = doc.y;
        if(invoice.items){        
            // Coordenadas iniciales de la tabla
            const columnWidths = [250, 80, 110, 80]; // Anchos de columnas
        
            // Encabezados de la tabla
            doc.text('Descripción', x, currentY);
            doc.text('Cantidad', x + columnWidths[0], currentY);
            doc.text('Precio Unitario', x + columnWidths[0] + columnWidths[1], currentY);
            doc.text('Subtotal', x + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY);
        
            currentY += 20; // Incrementar la posición Y para la siguiente fila
        
            const centerText = (text: string, columnWidth: number, x: number, doc: PDFKit.PDFDocument) => {
                const textWidth = doc.widthOfString(text);
                return x + (columnWidth - textWidth) / 2;
            };

            // Dibujar línea divisoria debajo de los encabezados
            doc.moveTo(x, currentY - 5).lineTo(x + 500, currentY - 5).stroke();

            // Imprimir los ítems
            invoice.items.forEach((item) => {
                doc.text(item.description, x, currentY);
                doc.text(item.quantity.toString(), centerText(`$${Number(item.quantity).toString()}`, columnWidths[1], ((x - 8) + columnWidths[0]), doc), currentY);
                doc.text(`$${Number(item.unitPrice).toFixed(2)}`, centerText(`$${Number(item.unitPrice).toFixed(2)}`, columnWidths[2], ((x - 10) + columnWidths[0] + columnWidths[1]), doc), currentY);
                doc.text(`$${Number(item.subtotal).toFixed(2)}`, centerText(`$${Number(item.subtotal).toFixed(2)}`, columnWidths[3], ((x - 13) + columnWidths[0] + columnWidths[1] + columnWidths[2]), doc), currentY);
                
                currentY += 20;
            });
    
            // Dibujar línea divisoria debajo de los ítems
            doc.moveTo(x, currentY - 5).lineTo(x + 500, currentY - 5).stroke();
            
            // Mostrar el total
            currentY += 10; // Espacio antes de mostrar el total
            doc.text('Total:', centerText('Total:', columnWidths[2], ((x - 10) + columnWidths[0] + columnWidths[1]), doc), currentY);
            doc.text(`$${Number(invoice.total).toFixed(2)}`, centerText(`$${Number(invoice.total).toFixed(2)}`, columnWidths[3], ((x - 13) + columnWidths[0] + columnWidths[1] + columnWidths[2]), doc), currentY);
        }    
        currentY += 30;
        doc.text('**Gracias por hospedarse con nosotros. ¡Vuelva pronto!**', 50, currentY, { align: 'center' });

        // Finalizar el PDF y devolverlo como buffer
        doc.end();
    
        return new Promise((resolve, reject) => {
          doc.on('end', () => resolve(Buffer.concat(buffers)));
          doc.on('error', (err) => reject(err));
        });  
    }

    async findAll(): Promise<InvoiceEntity[]> {
        return await this.invoiceRepository.find({
            relations: ['items', 'customer', 'booking', 'booking.room'],
        });
    }

    async findById(id: number): Promise<InvoiceEntity> {
        const invoice = await this.invoiceRepository.findOne({
            where: { id },
            relations: ['items', 'customer', 'booking', 'booking.room'],
        });
        if(!invoice) this.handleInvoiceNotFound(id);
        return invoice;
    }

    async create(invoiceDTO: CreateInvoiceDTO): Promise<InvoiceEntity> {
        const { bookingId, customerId, invoiceType, paymentStatus, items } = invoiceDTO;

        const booking = bookingId ? await this.bookigsService.findById(bookingId) : null;
        const customer = customerId ? await this.customersService.findById(customerId) : booking ? booking.customer : null;

        if(customer && booking && booking.customer.id !== customer.id) {
            throw new BadRequestException('El cliente ingresado no es el mismo que tiene la reserva ingresada.');
        }

        const stayItem = booking ? this.createInvoiceItem({
            description: 'Costo de estandía',
            quantity: Number(booking.totalStayDays),
            unitPrice: Number(booking.room.price),
            subtotal: this.calculateSubtotal(Number(booking.totalStayDays), Number(booking.room.price)),
            date: booking.actualCheckOutDate || booking.checkOutDate,
            type: InvoiceItemType.ESTANCIA,
        }) : null;

        const consumptionItem = booking?.consumptions?.
        filter(consumption => consumption.availability === ConsumptionAvailability.PENDIENTE).
        map((consumption) =>{
            this.consumptionService.update(consumption.id, { availability: ConsumptionAvailability.PAGADO });
            return this.createInvoiceItem({
                description: `Consumo de ${consumption.product.name}`,
                quantity: Number(consumption.quantity),
                unitPrice: Number(consumption.unitPrice),
                subtotal: Number(consumption.subtotal) || this.calculateSubtotal(Number(consumption.quantity), Number(consumption.unitPrice)) || 0,
                date: consumption.createdAt,
                type: InvoiceItemType.CONSUMO,
            })
        }) || [];

        const additionalItems = items?.map((item) => 
            this.createInvoiceItem({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal) || this.calculateSubtotal(Number(item.quantity), Number(item.unitPrice)) || 0,
                date: item.date || new Date(),
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

        newInvoice.total = newInvoice.items.reduce((total, item) => Number(total) + Number(item.subtotal), 0);

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
            throw new BadRequestException('La cantidad y el precio deben ser mayores a cero.');
        }
        
        return quantity * unitPrice;
    }

    private createInvoiceItem(data: Partial<InvoiceItemEntity>) {
        return this.itemRepository.create({ ...data });
    }
}
