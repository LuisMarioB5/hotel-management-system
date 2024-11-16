import { Injectable } from '@nestjs/common';
import { PDFReport } from './pdf.report';
import { BookingEntity } from 'src/bookings/booking.entity';
import { EnvConfig } from 'src/config/env.config';

@Injectable()
export class PDFService {    
    /**
     * Genera un reporte de reservas en PDF.
     * @param booking La reserva a incluir en el reporte.
     * @returns String con el directorio del PDF generado.
     */
    async generateBookingReport(booking: BookingEntity): Promise<string> {
        const pdfReport = new PDFReport();

        const outputPath = `${EnvConfig.DOWNLOAD_PATH}\\booking-report-${booking.id}.pdf`;

        pdfReport.generateReport(booking, outputPath);

        return outputPath;
    }
}
