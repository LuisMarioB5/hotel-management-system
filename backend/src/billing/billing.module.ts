import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceItemEntity } from './invoice.item.entity';
import { CustomersModule } from 'src/customers/customers.module';
import { BookingsModule } from 'src/bookings/bookings.module';
import { InvoicesController } from './invoices.controller';
import { ConsumptionsModule } from 'src/consumptions/consumptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvoiceEntity, InvoiceItemEntity]),
    CustomersModule,
    BookingsModule,
    ConsumptionsModule,
  ],
  providers: [InvoicesService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class BillingModule {}
