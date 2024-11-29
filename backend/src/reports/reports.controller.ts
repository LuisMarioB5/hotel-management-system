import { Body, Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

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
  async generateProductsOfferedReport(@Param('id') id: number, @Query('isActive') isActive: string, @Query('category') category: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.service.generateProductsOfferedReport('pdf', isActive, category);
  
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
        message: 'Error al generar reporte de servicios ofrecidos',
        error: error.message,
      });
    }
  }
}
