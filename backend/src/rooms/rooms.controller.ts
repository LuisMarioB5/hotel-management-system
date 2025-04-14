import { Controller, Get, Post, Body, Param, Patch, Delete, Query, BadRequestException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDTO } from './dtos/create.room.dto';
import { RoomEntity, RoomStatus } from './room.entity';
import { UpdateRoomDTO } from './dtos/update.room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly service: RoomsService,
  ) {}
  @Get('price-range') // Nuevo endpoint
  async getPriceRange() {
    return await this.service.getPriceRange();
  }
  @Post('register')
  async register(@Body() body: CreateRoomDTO) {
    return this.service.create(body);
  }

  @Get()
  async findAll(): Promise<RoomEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<RoomEntity> {
    return await this.service.findById(id);
  }

  @Get('roomNumber/:roomNumber')
  async findByRoomNumber(@Param('roomNumber') roomNumber: number): Promise<RoomEntity> {
    return await this.service.findByRoomNumber(roomNumber);
  }

  @Get('enums/values')
  async getEnumValues() {
    return this.service.getEnumValues();
  }

 

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateRoomDTO: UpdateRoomDTO) {
    return this.service.update(id, updateRoomDTO);
  }

  @Patch(':id/available')
  async roomAvailable(@Param('id') id: number) {
    return this.service.updateRoomStatus(id, RoomStatus.DISPONIBLE);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    await this.service.delete(id);
    return { message: `Habitación con ID ${id} eliminada exitosamente` };
  }
}