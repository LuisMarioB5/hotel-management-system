import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module'; // Tu módulo de usuarios
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EnvConfig } from 'src/config/env.config';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.register({
      secret: EnvConfig.JWT_SECRET,
      signOptions: { expiresIn: EnvConfig.JWT_TIME_TO_EXPIRE },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
