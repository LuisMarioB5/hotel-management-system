import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDTO } from './dtos/create-room.dto';
import { RoomEntity } from './room.entity';
import { UpdateRoomDTO } from './dtos/update-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  @Post('register')
  async register(@Body() body: CreateRoomDTO) {
    return this.service.create(body);
  }

  @Get()
  async findAll(): Promise<RoomEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findRoom(@Param('id') id: number): Promise<RoomEntity> {
      return this.service.findById(id);
    }

  @Patch(':id')
  async updateUser(@Param('id') id: number, @Body() updateRoomDTO: UpdateRoomDTO) {
    return this.service.update(id, updateRoomDTO);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    await this.service.delete(id);
    return { message: `Habitación con ID ${id} eliminada exitosamente` }
  }
}
