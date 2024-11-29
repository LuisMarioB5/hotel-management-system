import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Res } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceEntity } from './invoice.entity';
import { CreateInvoiceDTO } from './dtos/create.invoice.dto';
import { UpdatePaymentStatusDTO } from './dtos/update.payment.status.dto';
import { InvoiceItemType } from './invoice.item.entity';
import { Response } from 'express';

@Controller('billing/invoices')
export class InvoicesController {
    constructor(
        private readonly service: InvoicesService,
    ) {}

    @Get(':id/pdf')
    async generateInvoicePDF(@Param('id') id: number, @Res() res: Response) {
        try {
            const pdfBuffer = await this.service.generateInvoicePDF(id);

            // Configuración de headers para la descarga
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="factura-de-venta-${id}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });

            // Enviar el archivo PDF al cliente
            res.status(HttpStatus.OK).send(pdfBuffer);
        } catch (error) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                message: 'Error al generar la factura',
                error: error.message,
            });
        }
    }

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
