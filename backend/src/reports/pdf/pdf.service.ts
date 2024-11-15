import { Injectable } from '@nestjs/common';
import { PDFReport } from './pdf.report';

@Injectable()
export class PDFService {
  /**
   * Genera un reporte de reservas en PDF.
   * @param bookings Reservas a incluir en el reporte.
   * @returns Buffer con el contenido del PDF generado.
   */
  async generateBookingReport(bookings: any[]): Promise<Buffer> {
    const pdfReport = new PDFReport();
    await pdfReport.init();

    const page = pdfReport.addPage();
    pdfReport.addHeader(page, 'Reporte de Reservas', 'Período de Reservas');

    // Encabezados y filas de datos
    const headers = ['ID Reserva', 'Huésped', 'Check-in', 'Check-out', 'Total'];
    const rows = bookings.map((booking) => [
      booking.id.toString(),
      booking.customer.name,
      booking.checkInDate,
      booking.checkOutDate,
      `$${booking.totalStayCost}`,
    ]);

    pdfReport.addTable(page, headers, rows);

    return pdfReport.generate();
  }
}
