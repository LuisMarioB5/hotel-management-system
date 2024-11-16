import { Injectable } from '@nestjs/common';
import { BookingsService } from 'src/bookings/bookings.service';
import { PDFService } from './pdf/pdf.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pdfService: PDFService,
  ) {}

  async generateBookingReport(format: 'pdf' | 'excel', bookingId: number): Promise<string> {
    const booking = await this.bookingsService.findById(bookingId);

    if (format === 'pdf') {
      return await this.pdfService.generateBookingReport(booking);
    } 
    // else {
    //   return this.excelService.generateBookingReportExcel(booking);
    // }
  }

//   async generateConsumptionReport(format: 'pdf' | 'excel', bookingId: number) {
//     const consumptions = await this.consumptionsService.findAllByBookingId(bookingId);

//     if (format === 'pdf') {
//       return this.pdfService.generateConsumptionReportPDF(consumptions);
//     } else {
//       return this.excelService.generateConsumptionReportExcel(consumptions);
//     }
//   }
}
