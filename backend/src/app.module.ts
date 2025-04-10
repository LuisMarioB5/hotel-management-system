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

  import { DatabaseModule } from './database/database.module';
  import { 
    AmenityCategoryEntity, 
    AmenityEntity, 
    TechAmenityEntity, 
    FoodAmenityEntity, 
    LuxuryAmenityEntity, 
    ServiceAmenityEntity, 
    ViewAmenityEntity, 
    RoomAmenityEntity, 
    ClientAmenityEntity, 
    OfferEntity 
  } from './entities'; // Nuevas entidades

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
      autoLoadEntities: true,
      synchronize: true,
      timezone: 'Z',
    }),
    UsersModule,
    AuthModule,
    RoomsModule,
    CustomersModule,
    BookingsModule,
    ProductsModule,
    ConsumptionsModule,
    ReportsModule,
    BillingModule,
    OffersModule,
    AmenityCategoryEntity,
        AmenityEntity,
        TechAmenityEntity,
        FoodAmenityEntity,
        LuxuryAmenityEntity,
        ServiceAmenityEntity,
        ViewAmenityEntity,
        RoomAmenityEntity,
        ClientAmenityEntity,
        OfferEntity,
        DatabaseModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true para 465, false para otros puertos
        auth: {
          user: 'heatherpretty1@gmail.com', // Tu correo de Gmail
          pass: 'qejw sfee asjc tavj', // Contraseña de aplicación de Gmail
        },
      },
      defaults: {
        from: '"Hotel Hodelpa" <heatherpretty1@gmail.com>',
      },
    }),
  ],
})
export class AppModule {}
