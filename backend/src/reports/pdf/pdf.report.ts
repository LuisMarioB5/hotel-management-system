import { NotFoundException } from '@nestjs/common';
import PDFDocument, { fontSize } from 'pdfkit';
import { filter } from 'rxjs';
import { InvoiceEntity } from 'src/billing/invoice.entity';
import { InvoiceItemEntity } from 'src/billing/invoice.item.entity';
import { BookingEntity } from 'src/bookings/booking.entity';
import { ConsumptionEntity } from 'src/consumptions/consumption.entity';
import { ConsumptionsService } from 'src/consumptions/consumptions.service';
import { CustomerEntity } from 'src/customers/customer.entity';
import { ProductEntity } from 'src/products/product.entity';
import { DateFormatter } from 'src/utils/date.formatter';

export class PDFReport {
  private doc = new PDFDocument({ margin: 30 });

  generateInvoice(invoice: InvoiceEntity): Promise<Buffer> {
    const buffers = [];

    this.doc.on('data', buffers.push.bind(buffers));

    this.doc.moveDown();
    this.addHeader({ title: 'Factura de Consumo y Estadía'})

    this.addInvoiceInfo(invoice);
    
    this.addCustomerInfo(invoice.customer || invoice.booking.customer);

    this.addBookingInfo(invoice.booking);

    this.addInvoiceItemsTable(invoice);

    this.finishDocument({ message: '**Gracias por hospedarse con nosotros. ¡Vuelva pronto!**' });

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateConsumptionReport(booking: BookingEntity): Promise<Buffer> {
    if(booking?.consumptions?.length === 0) {
      throw new Error('La reserva ingresada no contiene ningun consumo para realizar el reporte.');
    }
    
    const checkinDate = booking.actualCheckInDate || booking.checkInDate;
    const checkoutDate = booking.actualCheckOutDate || (booking.checkOutDate || new Date());

    const buffers = [];
    this.doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader({ title: 'Reporte de Consumo del Huésped', period: this.parsePeriod(checkinDate, checkoutDate) });

    // Información del huésped
    this.addCustomerInfo(booking.customer);

    // Detalle de la reserva
    this.addBookingInfo(booking);

    // Tabla de consumos
    this.addConsumptionsTable(booking.consumptions);

    // Finalizar el reporte
    this.finishDocument();

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  generateTopConsumptionReport(consumptions: ConsumptionEntity[], limit: number, category: string): Promise<Buffer> {
    const buffers = [];
    this.doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.doc.moveDown()
    this.addHeader({ title: `Reporte del Top ${limit} Consumos más vendidos`, categoryFilter: category });

    // Tabla de consumos
    this.doc.moveDown();
    this.addTopConsumptionsTable(consumptions);

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

  generateBookingsByRoomReport(bookings: BookingEntity[], checkInDate: Date, checkOutDate: Date): Promise<Buffer> {
    const buffers = [];
    this.doc.on('data', buffers.push.bind(buffers));

    // Encabezado
    this.addHeader({ title: 'Reporte de Reservas por Habitación', period: this.parsePeriod(checkInDate, checkOutDate) });

    // Table de reservas
    this.addBookingTable(bookings);

    // Finalizar el reporte
    this.finishDocument();

    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  private addHeader({ title = null , period = null, categoryFilter = null } = {}): void {
    const centerTwoText = (text1: string, text2: string, size1: number, size2: number): { x: number, y: number} => {
      this.doc.fontSize(size1);
      const text1Width = this.doc.widthOfString(text1);

      this.doc.fontSize(size2);
      const text2Width = this.doc.widthOfString(text2);

      const totalTextWidth = text1Width + text2Width;
      const x = (this.doc.page.width - totalTextWidth) / 2;
      const y = this.doc.y;

      return { x, y };
    };
    
    this.doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Hotel Hodelpa', { align: 'center' })
      if(title) this.doc.text(`${title}`, { align: 'center' })
      this.doc.fontSize(12)
      .font('Helvetica')
      if(period) this.doc.text(`Período del Reporte: ${period}`, { align: 'center' })
      this.doc.text(`${DateFormatter.getSimpleDatetime(new Date())}`, { align: 'center' })
      if(categoryFilter && categoryFilter.toUpperCase() !== 'TODOS') {
        const label: string = 'Filtrado por Categoria: ';
        const text: string = categoryFilter.toUpperCase()
        const coor: { x: number, y: number } = centerTwoText(label, text, 12, 10);

        this.doc
          .fontSize(12).text(label, coor.x, coor.y, { continued: true })
          .fontSize(10).text(text, { continued: false })
          .fontSize(12)
          .x = 30;
      }
      this.doc.moveDown();
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

  private addInvoiceItemsTable(invoice: InvoiceEntity): void {
    const invoiceItems =  invoice.items;
    if (invoiceItems.length <= 0) {
      throw new NotFoundException('La factura actual no tiene items para mostrar');
    }
  
    const items = this.groupItemsByFields(invoiceItems.slice(), ['description', 'unitPrice']);

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
    let priceAdjustment: number = invoice.booking.priceAdjustment;
    let priceAdjustmentTitle = 'Estándar';
    if(priceAdjustment < 0) {
      priceAdjustmentTitle = 'Descuento(15%)';
      priceAdjustment = Number(invoice.items[0].subtotal) * .15;
    } else if(priceAdjustment > 0) {
      priceAdjustmentTitle = 'Tarifa(20%)';
      priceAdjustment = Number(invoice.items[0].subtotal) * .2;
    }
    const cashAdvance = invoice.booking.cashAdvance 
    const titles = ['Subtotal', 'Adelanto', `${priceAdjustmentTitle}`, 'Total'];
    const titlesValues = [totalItems, cashAdvance, priceAdjustment, `${Number(totalItems) + Number(priceAdjustment) - Number(cashAdvance)}`];
    const emptyWidth = columnWidths[0] + columnWidths[1];
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const value = titlesValues[i];
      if(value == 0 && title === 'Adelanto') continue;
      
      currentX = startX;
      this.doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
      currentX += emptyWidth;

      this.doc.text(`${title}:`, currentX, currentY, { width: columnWidths[2], align: 'right' });
      currentX += columnWidths[2];

      this.doc.text(`$${Math.abs(Number(value)).toFixed(2)}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentY += 20;
    }
  
    this.doc.moveDown();
  }

  private addConsumptionsTable(consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    consumptions = this.groupItemsByFields(consumptions, ['createdAt', 'unitPrice', 'product.name'])

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
    const emptyWidth = columnWidths[0] + columnWidths[1] + columnWidths[2];
    this.doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    this.doc.text('Total:', currentX, currentY, { width: columnWidths[3], align: 'center' });
    currentX += columnWidths[3];
    this.doc.text(`$${Number(totalConsumption).toFixed(2)}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
  
    this.doc.moveDown();
  }

  private addTopConsumptionsTable(consumptions: ConsumptionEntity[]): void {
    if (consumptions.length <= 0) {
      return null;
    }

    this.doc.fontSize(12).font('Helvetica');

    const tableHeaders = ['Top', 'ID', 'Descripción', 'Categoria', 'Cantidad', 'Precio Unitario', 'Subtotal'];
    const columnWidths = [30, 30, 140, 100, 70, 100, 70]; // Anchos de las columnas
    
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
  
    let totalConsumption: number = 0;
    let top: number = 1;

    // Imprimir cada fila de consumos
    consumptions.forEach((consumption) => {
      currentX = startX;

      const subtotal = Number(consumption.quantity) * Number(consumption.unitPrice);
      totalConsumption += Number(subtotal);
      
      // Top
      this.doc.text(`${top}`, currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
      top += 1;
      
      // Id
      this.doc.text(`${consumption.product.id}`, currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
      
      // Descripción
      this.doc.text(consumption.product.name, currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
      
      // Categoria
      this.doc.fontSize(10).text(`${consumption.product.category}`, currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];

      // Cantidad
      this.doc.fontSize(12).text(`${consumption.quantity}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentX += columnWidths[4];

      // Precio Unitario
      this.doc.text(`$${Number(consumption.unitPrice).toFixed(2)}`, currentX, currentY, { width: columnWidths[5], align: 'center' });
      currentX += columnWidths[5];
      
      // Subtotal
      this.doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = (columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4]);
    this.doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    this.doc.text('Total:', currentX, currentY, { width: columnWidths[5], align: 'center' });
    currentX += columnWidths[5];
    this.doc.text(`$${Number(totalConsumption).toFixed(2)}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
  
    this.doc.moveDown();
  }

  private addBookingTable(bookings: BookingEntity[]): void {
    this.doc
      .fontSize(10)
      .font('Helvetica')
      .moveDown();
  
    const tableHeaders = ['ID', 'CheckIn', 'CheckOut', 'Días', 'Estado', 'Cliente', 'Total Estadía', 'Total Consumos', 'Subtotal'];
    const columnWidths = [20, 60, 60, 40, 80, 80, 70, 75, 65]; // Anchos de las columnas
    
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
  
    let total = 0;
  
    // Imprimir cada fila de consumos
    bookings.forEach((booking) => {
      const stayCost = Number(booking.totalStayDays) * Number(booking.room?.price);
      const consumptionCost = booking.consumptions?.reduce((total, booking) => Number(total) + Number(booking.subtotal), 0);
      const subtotal = Number(stayCost) + Number(consumptionCost);
      total += subtotal;
      currentX = startX;
      
      this.doc.text(`${booking.id}`, currentX, currentY, { width: columnWidths[0], align: 'center' });
      currentX += columnWidths[0];
      
      this.doc.text(DateFormatter.getSimpleDate(booking.checkInDate), currentX, currentY, { width: columnWidths[1], align: 'center' });
      currentX += columnWidths[1];
      
      this.doc.text(DateFormatter.getSimpleDate(booking.checkOutDate), currentX, currentY, { width: columnWidths[2], align: 'center' });
      currentX += columnWidths[2];
      
      this.doc.text(booking.totalStayDays.toString(), currentX, currentY, { width: columnWidths[3], align: 'center' });
      currentX += columnWidths[3];
      
      this.doc.fontSize(9).text(`${booking.status}`, currentX, currentY, { width: columnWidths[4], align: 'center' });
      currentX += columnWidths[4];
      
      this.doc.fontSize(10).text(`${booking.customer.name} ${booking.customer.lastName}`, currentX, currentY, { width: columnWidths[5], align: 'center' });
      currentX += columnWidths[5];
      
      this.doc.text(`$${Number(stayCost).toFixed(2)}`, currentX, currentY, { width: columnWidths[6], align: 'center' });
      currentX += columnWidths[6];
      
      this.doc.text(`$${Number(consumptionCost).toFixed(2)}`, currentX, currentY, { width: columnWidths[7], align: 'center' });
      currentX += columnWidths[7];
      
      this.doc.text(`$${Number(subtotal).toFixed(2)}`, currentX, currentY, { width: columnWidths[8], align: 'center' });
      currentY += 20; // Espacio después de cada fila
    });
  
    // Dibujar una línea al final de la tabla para cerrarla
    this.doc.moveTo(startX, currentY).lineTo(this.doc.page.width - startX, currentY).stroke();
  
    // Espacio para el total de consumo
    currentY += 10;
  
    // Imprimir el total de consumo como una fila más en la tabla
    currentX = startX;
    const emptyWidth = (columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + columnWidths[6]);
    this.doc.text('', currentX, currentY, { width: emptyWidth, align: 'center' });
    currentX += emptyWidth;
    this.doc.text('Total:', currentX, currentY, { width: columnWidths[7], align: 'center' });
    currentX += columnWidths[7];
    this.doc.text(`$${Number(total).toFixed(2)}`, currentX, currentY, { width: columnWidths[8], align: 'center' });
  
    this.doc.moveDown();
  }

  private finishDocument({ message = null } = {}) {
    this.doc.moveDown
    this.doc
    .text(message || '**Fin del Reporte**', 50, this.doc.y, { align: 'center' });

    this.doc.end();
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
