import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingsService } from 'src/bookings/bookings.service';
import { PDFService } from './pdf/pdf.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly productsService: ProductsService,
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

  async generateProductsOfferedReport(format: 'pdf' | 'excel', isActive: string, category: string): Promise<Buffer> {
    let filteredProduct = await this.productsService.getFilteredProductsByIsActiveAndCategory(isActive, category);
    if(filteredProduct.length === 0) {
      throw new NotFoundException('No existen productos con los filtro seleccionados.');
    }
    if (format === 'pdf') {
      return await this.pdfService.generateProductsOfferedReportPDF(filteredProduct);
    } 
    // else {
    //   return this.excelService.generateConsumptionsReportExcel(products);
    // }
  }
}
