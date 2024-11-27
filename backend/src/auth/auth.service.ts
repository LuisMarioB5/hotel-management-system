import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/user.entity';
import { LoginUserDto } from './dtos/user.login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly MAX_FAILED_ATTEMPTS = 3;

  async validateUser(login: LoginUserDto): Promise<any> {    
    const user = await this.usersService.findByUsername(login.username);

    if(!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
  
    if(!user.isActive) {
      throw new UnauthorizedException('Usuario bloqueado. Contacte al administrador.');
    }
    
    const passwordMatches = await bcrypt.compare(login.password, user.password);
    if (!passwordMatches) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    await this.resetFailedAttempts(user);
    const { password, ...result } = user;
    return result;
  }

  async login(user: UserEntity) {
    const payload = { username: user.username, id: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  private async handleFailedLogin(user: UserEntity): Promise<void> {
    user.failedLoginAttempts++;
    user.lastFailedAttempt = new Date();
  
    if (user.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) {
      user.isActive = false;
    }
  
    await this.usersService.updateEntity(user);
  }
  
  private async resetFailedAttempts(user: UserEntity): Promise<void> {
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lastFailedAttempt = null;
      await this.usersService.updateEntity(user);
    }
  }
}
