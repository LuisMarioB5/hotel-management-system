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
    return this.service.create(body);
  }

  @Get()
  async findAll(): Promise<UserEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<UserEntity> {
    return this.service.findById(id);
  }

  @Get('username/:username')
  async findUser(@Param('username') username: string): Promise<UserEntity> {
    return this.service.findByUsername(username);
  }

  @Get('enums/values')
  async getEnumValues() {
    return this.service.getEnumValues();
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
