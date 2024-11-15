import { Injectable } from '@nestjs/common';
import { BookingsService } from 'src/bookings/bookings.service';
import { ConsumptionsService } from 'src/consumptions/consumptions.service';
import { PDFService } from './pdf/pdf.service';
import { ExcelService } from './excel/excel.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pdfService: PDFService,
    private readonly consumptionsService: ConsumptionsService,
    private readonly excelService: ExcelService,
  ) {}

  async generateBookingReport(format: 'pdf' | 'excel', startDate: Date, endDate: Date) {
    const bookings = await this.bookingsService.findBookingsWithinDateRange(startDate, endDate);

    if (format === 'pdf') {
      return this.pdfService.generateBookingReport(bookings);
    } 
    // else {
    //   return this.excelService.generateBookingReportExcel(bookings);
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
