import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { BookingEntity } from 'src/bookings/booking.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { CustomerEntity } from 'src/customers/customer.entity';

export class PDFReport {
  private doc: PDFDocument;

  constructor() {
    this.doc = new PDFDocument({ margin: 30 });
  }

  generateReport(booking: BookingEntity, outputPath: string): void {
    const checkinDate = this.formatDate(booking.actualCheckInDate || booking.checkInDate);
    const checkoutDate = this.formatDate(booking.actualCheckOutDate || (booking.checkOutDate || new Date()));

    // Encabezado
    this.addHeader(`${checkinDate} | ${checkoutDate}`);

    // Información del huésped
    this.addGuestInfo(booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(booking);

    // Detalle de consumos
    this.addConsumptions(booking.consumptions);

    // Resumen de costos totales
    this.addTotalSummary(booking);

    // Guardar el archivo
    this.save(outputPath);
  }

  private addHeader(reportPeriod: string): void {
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Hotel Hodelpa', { align: 'center' })
      .text('Reporte de Estadía y Consumo del Huésped', { align: 'center' })
      .fontSize(10)
      .font('Helvetica')
      .text(`Período del Reporte: ${reportPeriod}`, { align: 'center' })
      .moveDown();
  }

  private addGuestInfo(customer: CustomerEntity): void {
    this.doc
      .font('Helvetica-Bold')
      .text('Información del Huésped')
      .font('Helvetica')
      .text(`Nombre: ${customer.name}`)
      .text(`Documento: (${customer.documentType}) ${customer.documentNumber}`)
      .text(`Teléfono: ${customer.phoneNumber}`)
      .text(`Email: ${customer.email}`)
      .moveDown();
  }

  private addBookingInfo(booking: BookingEntity): void {
    const checkinDate = this.formatDate(booking.actualCheckInDate || booking.checkInDate);
    const checkoutDate = this.formatDate(booking.actualCheckOutDate || (booking.checkOutDate || new Date()));

    this.doc
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

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES');
  }

  private addConsumptions(consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }
  
    this.doc
      .font('Helvetica-Bold')
      .text('Consumos durante la Estadía')
      .font('Helvetica')
      .moveDown();
    
    const tableHeaders = ['Fecha', 'Producto/Servicio', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [100, 200, 100, 100, 100]; // Anchos de las columnas
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = (this.doc.page.width - totalWidth) / 2;
  
    // Establecer la posición inicial para las filas de la tabla
    let currentY = this.doc.y;
  
    // Dibujar una línea horizontal encima de la tabla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke(); 
    currentY += 10; // Espaciado debajo de la línea
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      this.doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      currentX += columnWidths[idx];
    });
  
    currentY += 20; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
    currentY += 5; // Espaciado debajo de la línea
  
    let totalConsumption = 0;
  
    // Imprimir cada fila de consumos
    consumptions.forEach((consumption) => {
      const subtotal = consumption.quantity * consumption.unitPrice;
      totalConsumption += subtotal;
  
      currentX = startX;
      this.doc.text(consumption.createdAt.toLocaleDateString(), currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
  
      this.doc.text(consumption.product.name, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
  
      this.doc.text(`${consumption.quantity}`, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
  
      this.doc.text(`$${consumption.unitPrice}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];
  
      this.doc.text(`$${subtotal}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
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
    this.doc.text('Total de Consumos:', currentX, currentY, { width: columnWidths[3], align: 'center' });
    currentX += columnWidths[3];
    this.doc.text(`$${totalConsumption}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
  
    // Dibujar una línea final debajo del total de consumos
    currentY += 20;
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
  
    this.doc.moveDown();
  }  

  private addTotalSummary(booking: BookingEntity): void {
    this.doc.moveDown();
    // Asegúrate de que el título esté fuera de la tabla de consumos
    let currentY = this.doc.y;
    this.doc.x = 30;

    // Título fuera de la tabla de consumos
    this.doc
      .font('Helvetica-Bold')
      .text('Resumen de Costos Totales')
      .font('Helvetica')
      .moveDown();
  
    // Definir los encabezados de la tabla y los anchos de las columnas
    const tableHeaders = ['Descripción', 'Monto'];
    const columnWidths = [500, 100]; // Anchos de las columnas
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = (this.doc.page.width - totalWidth) / 2;
  
    // Establecer la posición inicial para las filas de la tabla
    currentY = this.doc.y;
  
    // Dibujar una línea horizontal encima de la tabla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea

    // Imprimir encabezado de la tabla con alineación
    let currentX = 25; //25
    tableHeaders.forEach((header, idx) => {
      this.doc.text(header, currentX, currentY, { width: columnWidths[idx], align: idx === 0 ? 'left' : 'center' });
      currentX += columnWidths[idx] + startX - 25;
    });
  
    currentY += 20; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
    currentY += 5; // Espaciado debajo de la línea
  
    // Imprimir cada fila de resumen de costos
    const summaryData = [
      { description: 'Costo de Estadía', amount: booking.stayCost },
      ...(booking.consumptions.length > 0 ? [{ description: 'Total de Consumos', amount: booking.totalConsumption }] : []),
      { description: 'Costo Total de la Reserva', amount: booking.totalCost }
    ];
  
    summaryData.forEach((item) => {
      currentX = 15; //15
      
      // Columna de Descripción, ocupará el mismo espacio que las primeras columnas
      this.doc.text(item.description, currentX, currentY, { width: columnWidths[0], align: 'left' });
      currentX += columnWidths[0] + startX - 15;
  
      // Columna de Monto
      this.doc.text(`$${item.amount}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
  
    this.doc.moveDown();
  }
  
  private save(outputPath: string): void {   
    try {
      fs.writeFileSync(outputPath, 'Creación Inicial');
      this.doc.pipe(fs.createWriteStream(outputPath));
      this.doc.end();
    } catch (error) {
        throw new Error(`pdf.report | Error al crear el archivo: ${error}`)
    }
  }
}
