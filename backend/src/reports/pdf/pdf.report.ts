import { NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { start } from 'repl';
import { InvoiceEntity } from 'src/billing/invoice.entity';
import { BookingEntity, BookingStatus } from 'src/bookings/booking.entity';
import { BookingsController } from 'src/bookings/bookings.controller';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { CustomerEntity } from 'src/customers/customer.entity';
import { ProductEntity } from 'src/products/product.entity';
import { DateFormatter } from 'src/utils/date.formatter';

export class PDFReport {
  private reportMargin: number = 30;

  generateInvoice(invoice: InvoiceEntity): Promise<Buffer> {
    const doc = new PDFDocument({ margin: this.reportMargin });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    doc.moveDown();
    this.addHeader(doc, { title: 'Factura de Consumo y Estadía'})

    this.addInvoiceInfo(doc, invoice);
    
    this.addCustomerInfo(doc, invoice.customer || invoice.booking.customer);

    this.addBookingInfo(doc, invoice.booking, { priceAdjustment: true, cashAdvance: true });

    this.addInvoiceItemsTable(doc, invoice);

    this.finishDocument(doc, { message: 'Gracias por hospedarse con nosotros. ¡Vuelva pronto!' });

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateConsumptionReport(booking: BookingEntity): Promise<Buffer> {
    if(booking?.consumptions?.length === 0) {
      throw new Error('La reserva ingresada no contiene ningun consumo para realizar el reporte.');
    }

    const doc = new PDFDocument({ margin: this.reportMargin });
    
    const checkinDate = booking.actualCheckInDate || booking.checkInDate;
    const checkoutDate = booking.actualCheckOutDate || (booking.checkOutDate || new Date());

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader(doc, { title: 'Reporte de Consumo del Huésped', period: this.parsePeriod(checkinDate, checkoutDate) });

    // Información del huésped
    this.addCustomerInfo(doc, booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(doc, booking);

    // Tabla de consumos
    this.addConsumptionsTable(doc, booking.consumptions);

    // Finalizar el reporte
    this.finishDocument(doc);

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateTopConsumptionReport(consumptions: ConsumptionEntity[], limit: number, category: string): Promise<Buffer> {
    const doc = new PDFDocument({ margin: this.reportMargin });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    doc.moveDown()
    this.addHeader(doc, { title: `Reporte del Top ${limit} Consumos más vendidos`, categoryFilter: category });

    // Tabla de consumos
    doc.moveDown();
    this.addTopConsumptionsTable(doc, consumptions);

    // Finalizar el reporte
    this.finishDocument(doc);

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateProductsOfferedReport(products: ProductEntity[]): Promise<Buffer> {
    const doc = new PDFDocument({ margin: this.reportMargin });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader(doc, { title: 'Reporte de Consumo del Huésped' });

    // Finalizar el reporte
    this.finishDocument(doc);

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateBookingsByRoomReport(bookings: BookingEntity[], checkInDate: Date, checkOutDate: Date): Promise<Buffer> {
    const doc = new PDFDocument({ margin: this.reportMargin });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    const uniqueRoomNumbers = new Set(bookings.map(b => b.room.number));
    const title = uniqueRoomNumbers.size === 1
      ? `Reporte de Reservas de la Habitación #${bookings[0].room.number}`
      : 'Reporte de Reservas — Todas las Habitaciones';
    this.addHeader(doc, { title, period: this.parsePeriod(checkInDate, checkOutDate) });

    // Table de reservas
    this.addBookingTable(doc, bookings);

    // Finalizar el reporte
    this.finishDocument(doc);

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, { title = null , period = null, categoryFilter = null } = {}): void {
    const centerTwoText = (text1: string, text2: string, size1: number, size2: number): { x: number, y: number} => {
      doc.fontSize(size1);
      const text1Width = doc.widthOfString(text1);

      doc.fontSize(size2);
      const text2Width = doc.widthOfString(text2);

      const totalTextWidth = text1Width + text2Width;
      const x = (doc.page.width - totalTextWidth) / 2;
      const y = doc.y;

      return { x, y };
    };
    
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Hotel Hodelpa', { align: 'center' })
      if(title) doc.text(`${title}`, { align: 'center' })
      doc.fontSize(12)
      .font('Helvetica')
      if(period) doc.text(`Período del Reporte: ${period}`, { align: 'center' })
      doc.text(`${DateFormatter.getSimpleDatetime(new Date())}`, { align: 'center' })
      if(categoryFilter && categoryFilter.toUpperCase() !== 'TODOS') {
        const label: string = 'Filtrado por Categoria: ';
        const text: string = categoryFilter.toUpperCase()
        const coor: { x: number, y: number } = centerTwoText(label, text, 12, 10);

        doc
          .fontSize(12).text(label, coor.x, coor.y, { continued: true })
          .fontSize(10).text(text, { continued: false })
          .fontSize(12)
          .x = 30;
      }
      doc.moveDown();
  }

  private addInvoiceInfo(doc: PDFKit.PDFDocument, invoice: InvoiceEntity) {
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Factura No. ${invoice.id}`)
      .text(`Fecha de Emisión: ${DateFormatter.getSimpleDate(new Date(invoice.createdAt))}`)
      .text(`Tipo de Factura: ${invoice.invoiceType}`)
      .text(`Estado del Pago: ${invoice.paymentStatus}`)
      .moveDown();
  }

  private addCustomerInfo(doc: PDFKit.PDFDocument, customer: CustomerEntity): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Información del Huésped')
      .font('Helvetica')
      .text(`Nombre: ${customer.name} ${customer.lastName}`)
      if (customer?.documentType && customer?.documentNumber) {
          doc.text(`Documento: ${customer.documentType} ${customer.documentNumber}`);
      }
      if (customer?.phoneNumber) doc.text(`Teléfono: ${customer.phoneNumber}`);
      if (customer?.email) doc.text(`Email: ${customer.email}`);
      doc.moveDown();
  }

  private addBookingInfo(doc: PDFKit.PDFDocument, booking: BookingEntity, {priceAdjustment = null, cashAdvance = null} = {}): void {
    const checkinDate = DateFormatter.getSimpleDate(booking.actualCheckInDate || booking.checkInDate);
    const checkoutDate = DateFormatter.getSimpleDate(booking.actualCheckOutDate || (booking.checkOutDate || new Date()));

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Detalle de la Reserva')
      .font('Helvetica')
      .text(`ID de Reserva: ${booking.id}`)
      .text(`Check-in: ${checkinDate}`)
      .text(`Check-out: ${checkoutDate}`)
      .text(`Habitación: (${booking.room.type}) ${booking.room.number}`)
      .text(`Días de Estadía: ${booking.totalStayDays}`);
    if(priceAdjustment && booking.priceAdjustment) {
      let text: string = 'Estándar';
      if(booking.priceAdjustment < 0) {
        text = 'Descuento(15%)';
      } else if(booking.priceAdjustment > 0) {
        text = 'Aumento(20%)';
      }
      doc.text(`Tarifa: ${text}`);
    }
    if(cashAdvance && booking.cashAdvance) {
      doc.text(`Adelanto de efectivo: $${booking.cashAdvance}`);
    }
    doc.moveDown();
  }

  private addInvoiceItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceEntity): void {
    const invoiceItems =  invoice.items;
    if (invoiceItems.length <= 0) {
      throw new NotFoundException('La factura actual no tiene items para mostrar');
    }
  
    const items = this.groupItemsByFields(invoiceItems.slice(), ['description', 'unitPrice']);

    doc
      .fontSize(12)
      .font('Helvetica');
  
    const tableHeaders = ['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [250, 80, 110, 80]; // Anchos de las columnas
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = doc.x;
    let currentY = doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      if(header === 'Descripción') {
        doc.text(header, currentX, currentY, { width: columnWidths[idx] });
      } else {
        doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      }
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let totalItems = 0;
  
    // Imprimir cada fila de consumos
    items.forEach((item) => {
      const subtotal =  Number(item.subtotal);
      totalItems += subtotal;
  
      currentX = startX;      
      doc.text(item.description, currentX, currentY, { width: columnWidths[0] });
      currentX += columnWidths[0];
      
      doc.text(`${item.quantity}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
      
      doc.text(`$${Number(item.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
  
      doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = columnWidths[0] + columnWidths[1];
    doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;

    doc.text(`Total faltante:`, currentX, currentY, { width: columnWidths[2], align: 'right' });
    currentX += columnWidths[2];

    doc.text(`$${Math.abs(totalItems).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
    currentY += 20;
  
    doc.moveDown();
  }

  private addConsumptionsTable(doc: PDFKit.PDFDocument, consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    consumptions = this.groupItemsByFields(consumptions, ['createdAt', 'unitPrice', 'product.name'])

    doc.fontSize(12).font('Helvetica');
  
    const tableHeaders = ['Fecha', 'Producto/Servicio', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [90, 200, 80, 110, 80]; // Anchos de las columnas
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = doc.x;
    let currentY = doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let totalConsumption = 0;
  
    // Imprimir cada fila de consumos
    consumptions.forEach((consumption) => {
      const subtotal = Number(consumption.subtotal) ||  (Number(consumption.quantity) * Number(consumption.unitPrice));
      totalConsumption += subtotal;
  
      currentX = startX;
      doc.text(DateFormatter.getSimpleDate(consumption.createdAt), currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
  
      doc.text(consumption.product.name, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
  
      doc.text(`${consumption.quantity}`, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
  
      doc.text(`$${Number(consumption.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];
  
      doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = columnWidths[0] + columnWidths[1] + columnWidths[2];
    doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    doc.text('Total:', currentX, currentY, { width: columnWidths[3], align: 'center' });
    currentX += columnWidths[3];
    doc.text(`$${Number(totalConsumption).toFixed(2)}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
  
    doc.moveDown();
  }

  private addTopConsumptionsTable(doc: PDFKit.PDFDocument, consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    doc.fontSize(12).font('Helvetica');

    const tableHeaders = ['Top', 'ID', 'Descripción', 'Categoria', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [30, 30, 140, 100, 70, 100, 70]; // Anchos de las columnas
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = doc.x;
    let currentY = doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let totalConsumption: number = 0;
    let top: number = 1;

    // Imprimir cada fila de consumos
    consumptions.forEach((consumption) => {
      currentX = startX;

      const subtotal = Number(consumption.quantity) * Number(consumption.unitPrice);
      totalConsumption += Number(subtotal);
      
      // Top
      doc.text(`${top}`, currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
      top += 1;
      
      // Id
      doc.text(`${consumption.product.id}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
      
      // Descripción
      doc.text(consumption.product.name, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
      
      // Categoria
      doc.fontSize(10).text(`${consumption.product.category}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];

      // Cantidad
      doc.fontSize(12).text(`${consumption.quantity}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentX += columnWidths[4];

      // Precio Unitario
      doc.text(`$${Number(consumption.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[5], align: 'center' });
      currentX += columnWidths[5];
      
      // Subtotal
      doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = (columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4]);
    doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    doc.text('Total:', currentX, currentY, { width: columnWidths[5], align: 'center' });
    currentX += columnWidths[5];
    doc.text(`$${Number(totalConsumption).toFixed(2)}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
  
    doc.moveDown();
  }

  private addBookingTable(doc: PDFKit.PDFDocument, bookings: BookingEntity[]): void {
    doc
      .fontSize(10)
      .font('Helvetica')
      .moveDown();
  
    const tableHeaders = ['ID', 'Hab.', 'CheckIn', 'CheckOut', 'Días', 'Estado', 'Cliente', 'Total Estadía', 'Total Consumos', 'Subtotal'];
    const columnWidths = [20, 35, 55, 55, 30, 70, 70, 65, 70, 60]; // Anchos de las columnas
    
    // Establecer la posición inicial para las filas de la tabla
    const startX = doc.x;
    let currentY = doc.y;
  
    // Imprimir encabezado de la tabla centrado
    let currentX = startX;
    tableHeaders.forEach((header, idx) => {
      doc.text(header, currentX, currentY, { width: columnWidths[idx], align: 'center' });
      currentX += columnWidths[idx];
    });
  
    currentY += 15; // Espacio debajo del encabezado de la tabla
  
    // Dibujar otra línea debajo del encabezado
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
    currentY += 10; // Espaciado debajo de la línea
  
    let total = 0;
  
    // Imprimir cada fila de consumos
    bookings.forEach((booking) => {
      const stayCost = Number(booking.totalStayDays) * Number(booking.room?.price);
      const consumptionCost = booking.consumptions?.reduce((total, booking) => Number(total) + Number(booking.subtotal), 0);
      const subtotal = Number(stayCost) + Number(consumptionCost);
      currentX = startX;
      if(booking.status !== BookingStatus.CANCELADA) {
        total += subtotal;
      }
      
      doc.text(`${booking.id}`, currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];

      doc.text(`${booking.room.number}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];

      doc.text(DateFormatter.getSimpleDate(booking.checkInDate), currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];

      doc.text(DateFormatter.getSimpleDate(booking.checkOutDate), currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];

      doc.text(booking.totalStayDays.toString(), currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentX += columnWidths[4];

      doc.fontSize(9).text(`${booking.status}`, currentX, currentY, { width: columnWidths[5], align: 'center' });
      currentX += columnWidths[5];

      doc.fontSize(10).text(`${booking.customer.name} ${booking.customer.lastName}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
      currentX += columnWidths[6];

      doc.text(`$${Number(stayCost).toFixed(2)}`, currentX, currentY, { width: columnWidths[7], align: 'center' });
      currentX += columnWidths[7];

      doc.text(`$${Number(consumptionCost).toFixed(2)}`, currentX, currentY, { width: columnWidths[8], align: 'center' });
      currentX += columnWidths[8];

      doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[9], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    doc.moveTo(startX, currentY).lineTo(doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = (columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + columnWidths[6] + columnWidths[7]);
    doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    doc.text('Total faltante:', currentX, currentY, { width: columnWidths[8], align: 'center' });
    currentX += columnWidths[8];
    doc.text(`$${Number(total).toFixed(2)}`, currentX, currentY, { width: columnWidths[9], align: 'center' });
  
    doc.moveDown();
  }

  private finishDocument(doc: PDFKit.PDFDocument, { message = null } = {}) {
    doc.moveDown
    doc
    .text(`**${message || 'Fin del Reporte'}**`, 50, doc.y, { align: 'center' });

    doc.end();
  }

  private parsePeriod(firstDate: Date, secondDate: Date): string {
    const firstdate = DateFormatter.getSimpleDate(firstDate);
    const seconddate = DateFormatter.getSimpleDate(secondDate);

    return `${firstdate} | ${seconddate}`;
  }

  private groupItemsByFields<T extends Record<string, any>>(
    items: T[],
    fields: (keyof T | string)[],
  ): T[] {
    const groupedItems = items.reduce((acc, item) => {
      // Generar una clave única basada en los campos proporcionados
      const key = fields
        .map((field) => {
            // Soporte para relaciones: accede a propiedades anidadas
            const value = field.toString().split('.').reduce((obj, key) => obj?.[key], item);
            return value;
        })
        .join('-');
        
      if (!acc[key]) {
        // Si la clave no existe, clonar el item
        acc[key] = { ...item };
      } else {
        // Si la clave ya existe, sumar cantidades si corresponde
        if (hasQuantityAndSubtotal(acc[key]) && hasQuantityAndSubtotal(item)) {
            acc[key].quantity += item.quantity;
            acc[key].subtotal = acc[key].quantity * item.unitPrice;
        }
      }

      return acc;
    }, {} as Record<string, T>);
  
    // Convertir el objeto agrupado en un array
    return Object.values(groupedItems);
    
    // Type Guard para verificar si un objeto tiene las propiedades `quantity` y `subtotal`
    function hasQuantityAndSubtotal(obj: any): obj is { quantity: number; subtotal: number; unitPrice: number } {
      return 'quantity' in obj && 'subtotal' in obj && 'unitPrice' in obj;
    }
  }
}
