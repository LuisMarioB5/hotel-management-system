import { Injectable } from '@nestjs/common';
import { PDFReport } from './pdf.report';
import { BookingEntity } from 'src/bookings/booking.entity';
import { EnvConfig } from 'src/config/env.config';

@Injectable()
export class PDFService {    
    
    async generateConsumptionsReportPDF(booking: BookingEntity): Promise<Buffer> {
        const pdfReport = new PDFReport();
        return await pdfReport.generateConsumptionReport(booking);
    }
}
