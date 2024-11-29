import PDFDocument from 'pdfkit';
import { BookingEntity } from 'src/bookings/booking.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { CustomerEntity } from 'src/customers/customer.entity';
import { ProductEntity } from 'src/products/product.entity';
import { DateFormatter } from 'src/utils/date.formatter';

export class PDFReport {
  private doc = new PDFDocument({ margin: 30 });

  generateConsumptionReport(booking: BookingEntity): Promise<Buffer> {
    if(booking?.consumptions?.length === 0) {
      throw new Error('La reserva ingresada no contiene ningun consumo para realizar el reporte.');
    }
    
    const checkinDate = DateFormatter.getSimpleDate(booking.actualCheckInDate || booking.checkInDate);
    const checkoutDate = DateFormatter.getSimpleDate(booking.actualCheckOutDate || (booking.checkOutDate || new Date()));

    const buffers = [];
    this.doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader({ title: 'Reporte de Consumo del Huésped', period: `${checkinDate} | ${checkoutDate}` });

    // Información del huésped
    this.addGuestInfo(booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(booking);

    // Detalle de consumos
    this.addConsumptions(booking.consumptions);

    // Finalizar el reporte
    this.finishReport();

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateProductsOfferedReport(products: ProductEntity[]): Promise<Buffer> {
    
    const buffers = [];
    this.doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader({ title: 'Reporte de Consumo del Huésped' });

    // Finalizar el reporte
    this.finishReport();

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  private addHeader({ title = null , period = null } = {}): void {
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Hotel Hodelpa', { align: 'center' })
      if(title) this.doc.text(`${title}`, { align: 'center' })
      .fontSize(12)
      .font('Helvetica')
      if(period) this.doc.text(`Período del Reporte: ${period}`, { align: 'center' })
      .text(`${DateFormatter.getSimpleDatetime(new Date())}`, { align: 'center' })
      .moveDown();
  }

  private addGuestInfo(customer: CustomerEntity): void {
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Información del Huésped')
      .font('Helvetica')
      .text(`Nombre: ${customer.name} ${customer.lastName}`)
      .text(`Documento: (${customer.documentType}) ${customer.documentNumber}`)
      .text(`Teléfono: ${customer.phoneNumber}`)
      .text(`Email: ${customer.email}`)
      .moveDown();
  }

  private addBookingInfo(booking: BookingEntity): void {
    const checkinDate = DateFormatter.getSimpleDate(booking.actualCheckInDate || booking.checkInDate);
    const checkoutDate = DateFormatter.getSimpleDate(booking.actualCheckOutDate || (booking.checkOutDate || new Date()));

    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Detalle de la Reserva')
      .font('Helvetica')
      .text(`ID de Reserva: ${booking.id}`)
      .text(`Check-in: ${checkinDate}`)
      .text(`Check-out: ${checkoutDate}`)
      .text(`Habitación: (${booking.room.type}) ${booking.room.number}`)
      .text(`Días de Estadía: ${booking.totalStayDays}`)
      .moveDown();
  }

  private addConsumptions(consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    this.doc.fontSize(12).font('Helvetica');
  
    const tableHeaders = ['Fecha', 'Producto/Servicio', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [90, 200, 80, 110, 80]; // Anchos de las columnas [250, 80, 110, 80]
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = this.doc.x;
    let currentY = this.doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      this.doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let totalConsumption = 0;
  
    // Imprimir cada fila de consumos
    consumptions.forEach((consumption) => {
      const subtotal = consumption.quantity * consumption.unitPrice;
      totalConsumption += subtotal;
  
      currentX = startX;
      this.doc.text(DateFormatter.getSimpleDate(consumption.createdAt), currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
  
      this.doc.text(consumption.product.name, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
  
      this.doc.text(`${consumption.quantity}`, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
  
      this.doc.text(`$${Number(consumption.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];
  
      this.doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    this.doc.text('', currentX, currentY, { width: columnWidths[0], align: 'center' });
    currentX += columnWidths[0];
    this.doc.text('', currentX, currentY, { width: columnWidths[1], align: 'center' });
    currentX += columnWidths[1];
    this.doc.text('', currentX, currentY, { width: columnWidths[2], align: 'center' });
    currentX += columnWidths[2];
    this.doc.text('Total:', currentX, currentY, { width: columnWidths[3], align: 'center' });
    currentX += columnWidths[3];
    this.doc.text(`$${Number(totalConsumption).toFixed(2)}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
  
    this.doc.moveDown();
  }  

  private finishReport() {
    this.doc.moveDown
    this.doc
    .text('**Gracias por hospedarse con nosotros. ¡Vuelva pronto!**', 50, this.doc.y, { align: 'center' });

    this.doc.end();
  }
}
