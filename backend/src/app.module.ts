import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { EnvConfig } from './config/env.config';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';

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
    }),
    UsersModule,
    AuthModule,
    RoomsModule,
  ],
})
export class AppModule {}
