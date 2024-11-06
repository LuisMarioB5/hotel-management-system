import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDTO } from './dtos/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post('register')
  async register(@Body() body: CreateUserDTO) {
    return this.service.create(body.username, body.password, body.role, body.isActive);
  }

  @Get()
  async findAll(): Promise<UserEntity[]> {
    return this.service.findAll();
  }

  @Get(':param')
  async findUser(@Param('param') param: string): Promise<UserEntity> {
    if (!isNaN(Number(param))) {
      // Es un número, tratar como ID
      return this.service.findById(Number(param));
    } else {
      // Es una cadena, tratar como nombre de usuario
      return this.service.findByUsername(param);
    }
  }

  @Patch(':id')
  async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.service.update(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    await this.service.delete(id);
    return { message: `Usuario con ID ${id} eliminado exitosamente` }
  }
}
