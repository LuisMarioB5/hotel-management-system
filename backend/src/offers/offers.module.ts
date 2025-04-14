import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';

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
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}