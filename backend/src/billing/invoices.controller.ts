import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceEntity, InvoiceType, PaymentStatus } from './invoice.entity';
import { CreateInvoiceDTO } from './dtos/create.invoice.dto';
import { UpdatePaymentStatusDTO } from './dtos/update.payment.status.dto';
import { InvoiceItemType } from './invoice.item.entity';

@Controller('billing/invoices')
export class InvoicesController {
    constructor(
        private readonly service: InvoicesService,
    ) {}

    @Get()
    async getAllInvoices(): Promise<InvoiceEntity[]> {
        return await this.service.findAll();
    }

    @Get(':id')
    async getInvoiceDetails(@Param('id', ParseIntPipe) id: number): Promise<Object> {
        const invoice = await this.service.findById(id);
        const stayItem = invoice.items.filter(item => item.type === InvoiceItemType.ESTANCIA);
        const consumptionItems = invoice.items.filter(item => item.type === InvoiceItemType.CONSUMO);
        const penaltyItems = invoice.items.filter(item => item.type === InvoiceItemType.PENALIDAD);
        
        return {
            invoice,
            categorizedItems: {
                estancia: stayItem,
                consumos: consumptionItems,
                penalidades: penaltyItems,
            },
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createInvoice(@Body() invoice: CreateInvoiceDTO): Promise<InvoiceEntity> {
        return await this.service.create(invoice);
    }

    @Patch(':id/payment-status')
    async updateInvoicePaymentStatus(
        @Param('id', ParseIntPipe) id: number, 
        @Body() dto: UpdatePaymentStatusDTO,
    ): Promise<InvoiceEntity> {
        return await this.service.updatePaymentStatus(id, dto.paymentStatus);
    }

    @Patch(':id')
    async disableInvoice(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
        await this.service.disable(id);
        return { message: `Factura con ID ${id} desactivada con éxito.` };
    }

    @Get('enums/values')
    getEnumValues() {
        return this.service.getEnumValues();
    }
}
