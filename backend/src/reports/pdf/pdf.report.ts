import { NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InvoiceEntity } from 'src/billing/invoice.entity';
import { InvoiceItemEntity } from 'src/billing/invoice.item.entity';
import { BookingEntity } from 'src/bookings/booking.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { CustomerEntity } from 'src/customers/customer.entity';
import { ProductEntity } from 'src/products/product.entity';
import { DateFormatter } from 'src/utils/date.formatter';

export class PDFReport {
  private doc = new PDFDocument({ margin: 30 });

  generateInvoice(invoice: InvoiceEntity): Promise<Buffer> {
    const buffers = [];

    this.doc.on('data', buffers.push.bind(buffers));

    this.addHeader({ title: 'Factura de Consumo y Estadía'})

    this.addInvoiceInfo(invoice);
    
    this.addCustomerInfo(invoice.customer || invoice.booking.customer);

    this.addBookingInfo(invoice.booking);

    this.addInvoiceItems(invoice.items);

    this.finishDocument();

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

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
    this.addCustomerInfo(booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(booking);

    // Detalle de consumos
    this.addConsumptions(booking.consumptions);

    // Finalizar el reporte
    this.finishDocument();

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
    this.finishDocument();

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
      this.doc.text(`${DateFormatter.getSimpleDatetime(new Date())}`, { align: 'center' })
      .moveDown();
  }

  private addInvoiceInfo(invoice: InvoiceEntity) {
    this.doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Factura No. ${invoice.id}`)
      .text(`Fecha de Emisión: ${DateFormatter.getSimpleDate(new Date(invoice.createdAt))}`)
      .text(`Tipo de Factura: ${invoice.invoiceType}`)
      .text(`Estado del Pago: ${invoice.paymentStatus}`)
      .moveDown();
  }

  private addCustomerInfo(customer: CustomerEntity): void {
    this.doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Información del Huésped')
      .font('Helvetica')
      .text(`Nombre: ${customer.name} ${customer.lastName}`)
      if (customer?.documentType && customer?.documentNumber) {
          this.doc.text(`Documento: ${customer.documentType} ${customer.documentNumber}`);
      }
      if (customer?.phoneNumber) this.doc.text(`Teléfono: ${customer.phoneNumber}`);
      if (customer?.email) this.doc.text(`Email: ${customer.email}`);
      this.doc.moveDown();
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

  private addInvoiceItems(items: InvoiceItemEntity[]): void {
    if (items.length <= 0) {
      throw new NotFoundException('La factura actual no tiene items para mostrar');
    }

    function groupInvoiceItemsByDescriptionAndUnitPrice(items: InvoiceItemEntity[]): InvoiceItemEntity[] {
      const groupedItems = items.reduce((acc, item) => {
          // Generate a unique key based on description and unitPrice
          const key = `${item.description}-${item.unitPrice}`;
  
          if (!acc[key]) {
              // If the key doesn't exist, add a new item
              acc[key] = { ...item }; // Clone the item
          } else {
              // If the key exists, sum the quantities and recalculate the subtotal
              acc[key].quantity += item.quantity;
              acc[key].subtotal = acc[key].quantity * acc[key].unitPrice;
          }
  
          return acc;
      }, {} as Record<string, InvoiceItemEntity>);
  
      // Convert the grouped items object into an array
      return Object.values(groupedItems);
    }
  
    items = groupInvoiceItemsByDescriptionAndUnitPrice(items);

    this.doc
      .fontSize(12)
      .font('Helvetica');
  
    const tableHeaders = ['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [250, 80, 110, 80]; // Anchos de las columnas
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = this.doc.x;
    let currentY = this.doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      if(header === 'Descripción') {
        this.doc.text(header, currentX, currentY, { width: columnWidths[idx] });
      } else {
        this.doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      }
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let totalItems = 0;
  
    // Imprimir cada fila de consumos
    items.forEach((item) => {
      const subtotal = Number(item.subtotal) || (Number(item.quantity) * Number(item.unitPrice));
      totalItems += subtotal;
  
      currentX = startX;      
      this.doc.text(item.description, currentX, currentY, { width: columnWidths[0] });
      currentX += columnWidths[0];
      
      this.doc.text(`${item.quantity}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
      
      this.doc.text(`$${Number(item.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
  
      this.doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
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
    this.doc.text('Total:', currentX, currentY, { width: columnWidths[2], align: 'center' });
    currentX += columnWidths[2];
    this.doc.text(`$${Number(totalItems).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
  
    this.doc.moveDown();
  }

  private addConsumptions(consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    this.doc.fontSize(12).font('Helvetica');
  
    const tableHeaders = ['Fecha', 'Producto/Servicio', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [90, 200, 80, 110, 80]; // Anchos de las columnas
    
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
      const subtotal = Number(consumption.subtotal) ||  (Number(consumption.quantity) * Number(consumption.unitPrice));
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

  private finishDocument() {
    this.doc.moveDown
    this.doc
    .text('**Gracias por hospedarse con nosotros. ¡Vuelva pronto!**', 50, this.doc.y, { align: 'center' });

    this.doc.end();
  }
}
