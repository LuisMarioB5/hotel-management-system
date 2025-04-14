import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { RoomsModule } from '../rooms/rooms.module'; // Importar RoomsModule
import { CustomersModule } from '../customers/customers.module'; // Importar CustomersModule

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
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
    RoomsModule, // Añadir RoomsModule para inyectar RoomsService
    CustomersModule, // Añadir CustomersModule para inyectar CustomersService
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}