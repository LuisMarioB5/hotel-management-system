import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomEntity, RoomFloor, RoomStatus, RoomType } from './room.entity';
import { UpdateRoomDTO } from './dtos/update.room.dto';
import { CreateRoomDTO } from './dtos/create.room.dto';
import { getEnumValues } from 'src/utils/showEnum.values';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly repository: Repository<RoomEntity>,
  ) {}

  async create(room: CreateRoomDTO): Promise<RoomEntity> {
    const newRoom = this.repository.create(room);
    return this.repository.save(newRoom);
  }

  async findAll(): Promise<RoomEntity[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<RoomEntity> {
    const room = await this.repository.findOne({ where: { id } });
    if (!room) this.throwRoomNotFoundException(id);
    return room;
  }

  async findByRoomNumber(number: number): Promise<RoomEntity> {
    const room = await this.repository.findOne({ where: { number } });
    if (!room) throw new NotFoundException(`Habitación con el número ${number} no encontrada`);
    return room;
  }

  async update(id: number, newRoom: UpdateRoomDTO): Promise<RoomEntity> {
    const room = await this.findById(id);

    if(newRoom.number !== null) room.number = newRoom.number;
    if(newRoom.details !== null) room.details = newRoom.details;
    if(newRoom.floor !== null) room.floor = newRoom.floor;
    if(newRoom.type !== null) room.type = newRoom.type;
    if(newRoom.status !== null) room.status = newRoom.status;
    if(newRoom.price !== null) room.price = newRoom.price;
    if(newRoom.isAvailable !== null) room.isAvailable = newRoom.isAvailable;

    return this.repository.save(room);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      this.throwRoomNotFoundException(id);
    }
  }

  async updateRoomStatus(id: number, status: RoomStatus): Promise<RoomEntity> {
    const room = await this.findById(id);
    room.status = status;
    room.isAvailable = room.status === RoomStatus.DISPONIBLE;
    return await this.repository.save(room);
  }

  async findByStatus(status: RoomStatus): Promise<RoomEntity[]> {
    return this.repository.find({ where: { status } });
  }

  getEnumValues() {
    return getEnumValues({ RoomStatus, RoomFloor, RoomType });
  }

  private throwRoomNotFoundException(id: number) {
    throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
  }
}
