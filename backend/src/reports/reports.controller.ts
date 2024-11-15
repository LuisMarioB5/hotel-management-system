import { Controller, Get, Query, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('/bookings')
  async getBookingsReport(
    @Query('format') format: 'pdf' | 'excel',
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.reportsService.generateBookingReport(format, startDate, endDate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="bookings-report.pdf"',
    });
    res.send(pdfBuffer);
  }
}
