import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingsService } from 'src/bookings/bookings.service';
import { PDFService } from './pdf/pdf.service';
import { ProductsService } from 'src/products/products.service';
import { DateFormatter } from 'src/utils/date.formatter';
import { ConsumptionsService } from 'src/consumptions/consumptions.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly productsService: ProductsService,
    private readonly consumptionsService: ConsumptionsService,
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

  async generateBookingsByRoomReport(format: 'pdf' | 'excel', roomId: number, checkInDate: string, checkOutDate: string): Promise<Buffer> {
    const checkinDate = DateFormatter.parseStrDate(checkInDate, 'MM/dd/yyyy');
    const checkoutDate = checkOutDate ? DateFormatter.parseStrDate(checkOutDate, 'MM/dd/yyyy') : new Date();
    
    let filteredBookings = await this.bookingsService.getReservationsByRoomAndDateRange(roomId, checkinDate, checkoutDate);
    if(filteredBookings.length === 0) {
      throw new NotFoundException('No existen reservas para la habitación en el periodo de tiempo seleccionado.');
    }

    if (format === 'pdf') {
      return await this.pdfService.generateBookingsByRoomReportPDF(filteredBookings, checkinDate, checkoutDate);
    } 
    // else {
    //   return this.excelService.generateConsumptionsReportExcel(products);
    // }
  }

  async generateTopConsumptionReport(format: 'pdf' | 'excel', limit: number, category: string): Promise<Buffer> {
    let filteredConsumptions = await this.consumptionsService.getTopConsumptions(limit, category);
    if(filteredConsumptions.length === 0) {
      throw new NotFoundException('No existen consumos actualmente.');
    }
    
    if (format === 'pdf') {
      return await this.pdfService.generateTopConsumptionReportPDF(filteredConsumptions, limit, category);
    } 
    // else {
    //   return this.excelService.generateConsumptionsReportExcel(products);
    // }
  }
}
