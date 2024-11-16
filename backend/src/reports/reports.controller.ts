import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('booking/pdf/:id')
  async getBookingReport(@Param('id') id: number, @Res() res: Response) {
    const reportPath = await this.service.generateBookingReport('pdf', id);

    // Enviar el archivo al cliente
    res.download(reportPath, `reporte-reserva-${id}.pdf`);
  }
}
