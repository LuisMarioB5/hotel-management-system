import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginUserDto } from '../dtos/user.login.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(login: LoginUserDto): Promise<any> {
    const user = await this.authService.validateUser(login);
    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }
    return user;
  }
}
