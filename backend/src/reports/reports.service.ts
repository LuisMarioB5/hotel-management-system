import { Injectable } from '@nestjs/common';
import { BookingsService } from 'src/bookings/bookings.service';
import { PDFService } from './pdf/pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pdfService: PDFService,
  ) {}

  async generateConsumptionsReport(format: 'pdf' | 'excel', bookingId: number): Promise<Buffer> {
    const booking = await this.bookingsService.findById(bookingId);

    if (format === 'pdf') {
      return await this.pdfService.generateConsumptionsReportPDF(booking);
    } 
    // else {
    //   return this.excelService.generateConsumptionsReportExcel(booking);
    // }
  }
}
