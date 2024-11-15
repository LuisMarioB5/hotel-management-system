import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PDFService } from './pdf/pdf.service';
import { ExcelService } from './excel/excel.service';
import { ReportsController } from './reports.controller';
import { BookingsModule } from 'src/bookings/bookings.module';
import { ConsumptionsModule } from 'src/consumptions/consumptions.module';

@Module({
  imports:[
    BookingsModule,
    ConsumptionsModule,
  ],
  providers: [ReportsService, PDFService, ExcelService],
  controllers: [ReportsController]
})
export class ReportsModule {}
