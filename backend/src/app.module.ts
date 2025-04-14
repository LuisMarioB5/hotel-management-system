import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { EnvConfig } from './config/env.config';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { CustomersModule } from './customers/customers.module';
import { BookingsModule } from './bookings/bookings.module';
import { ProductsModule } from './products/products.module';
import { ConsumptionsModule } from './consumptions/consumptions.module';
import { ReportsModule } from './reports/reports.module';
import { BillingModule } from './billing/billing.module';
import { OffersModule } from './offers/offers.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { BookingEntity } from './bookings/booking.entity';

import { CustomerEntity } from './customers/customer.entity';
import { RoomEntity } from './rooms/room.entity';
import { ConsumptionEntity } from './consumptions/consumption.entity';
import { InvoiceEntity } from './billing/invoice.entity';
import { AmenitiesModule } from './amenities/amenities.module';
import { PreferencesModule } from './preferences/preferences.module';
import { 
  AmenityCategoryEntity, 
  AmenityEntity,
  AmenityOptionEntity,
  ClientConfigurationEntity,
  RoomAmenityEntity, 
  ClientAmenityEntity, 
  OfferEntity 
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: EnvConfig.DB_HOST,
      port: EnvConfig.DB_PORT,
      username: EnvConfig.DB_USER,
      password: EnvConfig.DB_PWD,
      database: EnvConfig.DB_NAME,
      entities: [
        BookingEntity,
        CustomerEntity,
        RoomEntity,
        ConsumptionEntity,
        InvoiceEntity,
        AmenityCategoryEntity,
        AmenityEntity,
        ClientConfigurationEntity,
        AmenityOptionEntity,
        RoomAmenityEntity,
        ClientAmenityEntity,
        OfferEntity,
      ],
      autoLoadEntities: true,
      synchronize: true,
      timezone: 'Z',
    }),
    UsersModule,
    OffersModule,
    RoomsModule,
    AmenitiesModule,
    PreferencesModule,
    AuthModule,
    CustomersModule,
    BookingsModule,
    ProductsModule,
    ConsumptionsModule,
    ReportsModule,
    BillingModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'heatherpretty1@gmail.com',
          pass: 'qejw sfee asjc tavj',
        },
      },
      defaults: {
        from: '"Hotel Hodelpa" <heatherpretty1@gmail.com>',
      },
    }),
  ],
})
export class AppModule {}