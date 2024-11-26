import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceItemEntity } from './invoice.item.entity';
import { CustomersModule } from 'dist/customers/customers.module';
import { BookingsModule } from 'dist/bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity, InvoiceItemEntity]),
    CustomersModule,
    BookingsModule,
  ],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class BillingModule {}
