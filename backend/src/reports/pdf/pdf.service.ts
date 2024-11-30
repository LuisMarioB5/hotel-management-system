import { Injectable } from '@nestjs/common';
import { PDFReport } from './pdf.report';
import { BookingEntity } from 'src/bookings/booking.entity';
import { EnvConfig } from 'src/config/env.config';
import { ProductEntity } from 'src/products/product.entity';

@Injectable()
export class PDFService {
    private readonly pdfReport = new PDFReport();

    async generateConsumptionsReportPDF(booking: BookingEntity): Promise<Buffer> {
        return await this.pdfReport.generateConsumptionReport(booking);
    }
    
    async generateProductsOfferedReportPDF(products: ProductEntity[]): Promise<Buffer> {
        return await this.pdfReport.generateProductsOfferedReport(products);
    }
    
    async generateBookingsByRoomReportPDF(bookings: BookingEntity[], checkInDate: Date, checkOutDate: Date): Promise<Buffer> {
        return await this.pdfReport.generateBookingsByRoomReport(bookings, checkInDate, checkOutDate);
    }
}
