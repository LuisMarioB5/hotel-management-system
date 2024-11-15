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
    // Encabezado
    this.addHeader(`${booking.actualCheckInDate} | ${booking.actualCheckOutDate || new Date()}`);

    // Información del huésped
    this.addGuestInfo(booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(booking);

    // Detalle de consumos
    const totalConsumption = this.addConsumptions(booking.consumptions);

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
    this.doc
      .font('Helvetica-Bold')
      .text('Detalle de la Reserva')
      .font('Helvetica')
      .text(`ID de Reserva: ${booking.id}`)
      .text(`Check-in: ${booking.actualCheckInDate}`)
      .text(`Check-out: ${booking.actualCheckOutDate || new Date()}`)
      .text(`Habitación: (${booking.room.type}) ${booking.room.number}`)
      .text(`Días de Estadía: ${booking.totalStayDays}`)
      .moveDown();
  }

  private addConsumptions(consumptions: ConsumptionEntity[]): number {
    this.doc
      .font('Helvetica-Bold')
      .text('Consumos durante la Estadía')
      .font('Helvetica')
      .text('Fecha | Producto/Servicio | Cantidad | Precio Unitario | Subtotal');

    let totalConsumption = 0;

    consumptions.forEach((consumption) => {
      const subtotal = consumption.quantity * consumption.unitPrice;
      totalConsumption += subtotal;
      this.doc.text(`${consumption.createdAt} | ${consumption.product} | ${consumption.quantity} | $${consumption.unitPrice.toFixed(2)} | $${subtotal.toFixed(2)}`);
    });

    this.doc.text(`Total de Consumos: $${totalConsumption.toFixed(2)}`).moveDown();
    return totalConsumption;
  }

  private addTotalSummary(booking: BookingEntity): void {
    this.doc
      .font('Helvetica-Bold')
      .text('Resumen de Costos Totales')
      .font('Helvetica')
      .text(`Costo de Estadía: $${booking.stayCost.toFixed(2)}`)
      .text(`Total de Consumos: $${booking.totalConsumption.toFixed(2)}`)
      .text(`Costo Total de la Reserva: $${booking.totalCost.toFixed(2)}`)
      .moveDown();
  }

  private save(outputPath: string): void {
    this.doc.pipe(fs.createWriteStream(outputPath));
    this.doc.end();
  }
}
