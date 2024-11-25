import { Injectable } from '@nestjs/common';
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

  async validateUser(login: LoginUserDto): Promise<any> {
    const user = await this.usersService.findByUsername(login.username);
    if (user.isActive && await bcrypt.compare(login.password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserEntity) {
    const payload = { username: user.username, id: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
