import { Body, Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { DateFormatter } from 'src/utils/date.formatter';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('consumptions/:id/pdf')
  async generateConsumptionsReport(@Param('id') id: number, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.generateConsumptionsReport('pdf', id);
  
      // Configuración de headers para la descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-de-venta-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
  
      // Enviar el archivo PDF al cliente
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error al generar reporte de consumo',
        error: error.message,
      });
    }
  }
  
  @Get('productsOffered/pdf')
  async generateProductsOfferedReport(@Query('isActive') isActive: string, @Query('category') category: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.generateProductsOfferedReport('pdf', isActive, category);
      const date = new Date()
      
      // Configuración de headers para la descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-de-productos-ofrecidos-${DateFormatter.getStrDate(date)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
  
      // Enviar el archivo PDF al cliente
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error al generar reporte de servicios ofrecidos',
        error: error.message,
      });
    }
  }
  
  @Get('bookingsByRoom/:roomId/pdf')
  async generateBookingsByRoomReport(@Param('roomId') roomId: number, @Query('checkInDate') checkInDate: string, @Query('checkOutDate') checkOutDate: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.generateBookingsByRoomReport('pdf', roomId, checkInDate, checkOutDate);
      const date = new Date()
      
      // Configuración de headers para la descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-de-rerservas-por-habitacion-${DateFormatter.getStrDate(date)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
  
      // Enviar el archivo PDF al cliente
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error al generar reporte de reservas por habitaciones en un periodo de tiempo',
        error: error.message,
      });
    }
  }
  
  @Get('topConsumptions/pdf')
  async generateTopConsumptionReport(@Query('limit') limit: number, @Query('category') category: string, @Res() res: Response) {
    try {
      if(!limit) throw new Error('Se debe introducir la consulta \'limit\' para el top "limit" de consumos más vendidos.');
      const pdfBuffer = await this.service.generateTopConsumptionReport('pdf', limit, category);
      const date = new Date()
      
      // Configuración de headers para la descarga
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-de-top-consumos-${DateFormatter.getStrDate(date)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
  
      // Enviar el archivo PDF al cliente
      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error al generar reporte de top consumos del hotel',
        error: error.message,
      });
    }
  }
}
