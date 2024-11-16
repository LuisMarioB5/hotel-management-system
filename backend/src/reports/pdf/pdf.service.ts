import { Injectable } from '@nestjs/common';
import { PDFReport } from './pdf.report';
import { BookingEntity } from 'src/bookings/booking.entity';

@Injectable()
export class PDFService {    
    /**
     * Genera un reporte de reservas en PDF.
     * @param booking La reserva a incluir en el reporte.
     * @returns String con el directorio del PDF generado.
     */
    async generateBookingReport(booking: BookingEntity): Promise<string> {
        const pdfReport = new PDFReport();

        const fs = require('fs');
        const outputPath = `C:\\Users\\LUISM\\Downloads\\booking-report-${booking.id}.pdf`;
        try {
            fs.writeFileSync(outputPath, 'Creación Inicial');
        } catch (error) {
            throw new Error(`pdf.service | Error al crear el archivo: ${error}`)
        }

        pdfReport.generateReport(booking, outputPath);

        return outputPath;
    }
}
