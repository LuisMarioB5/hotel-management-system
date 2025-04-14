import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RoomEntity, RoomFloor, RoomStatus, RoomType } from './room.entity';
import { UpdateRoomDTO } from './dtos/update.room.dto';
import { CreateRoomDTO } from './dtos/create.room.dto';
import { getEnumValues } from 'src/utils/showEnum.values';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly repository: Repository<RoomEntity>,
    @InjectDataSource() private readonly dataSource: DataSource, // Añadimos DataSource para consultas personalizadas
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

    if (newRoom.number !== null) room.number = newRoom.number;
    if (newRoom.details !== null) room.details = newRoom.details;
    if (newRoom.floor !== null) room.floor = newRoom.floor;
    if (newRoom.type !== null) room.type = newRoom.type;
    if (newRoom.status !== null) room.status = newRoom.status;
    if (newRoom.price !== null) room.price = newRoom.price;
    if (newRoom.isAvailable !== null) room.isAvailable = newRoom.isAvailable;

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

  async getPriceRange() {
    try {
      const result = await this.repository.query(`
        SELECT 
          MIN(price) AS minPrice,
          MAX(price) AS maxPrice
        FROM rooms
      `);

      return {
        minPrice: result[0].minPrice || 1000, // Valor por defecto si no hay datos
        maxPrice: result[0].maxPrice || 10000, // Valor por defecto si no hay datos
      };
    } catch (error) {
      throw new Error(`Error al obtener el rango de precios: ${error.message}`);
    }
  }

  // Método para obtener las amenidades de una habitación
  async getRoomAmenities(roomId: number) {
    try {
      // Verificar si la habitación existe
      const roomExists = await this.repository.findOne({ where: { id: roomId } });
      if (!roomExists) {
        throw new NotFoundException(`Habitación con ID ${roomId} no encontrada`);
      }

      // Obtener todas las categorías
      const categories = await this.dataSource.query(`
        SELECT 
          id,
          name
        FROM amenity_categories
        ORDER BY name
      `);

      // Para cada categoría, obtener las opciones y las amenidades asociadas a la habitación
      const result = await Promise.all(categories.map(async (category) => {
        const options = await this.dataSource.query(`
          SELECT 
            ao.id,
            ao.name
          FROM amenity_options ao
          WHERE ao.id_category = ?
          ORDER BY ao.name
        `, [category.id]);

        // Para cada opción, obtener las amenidades asociadas a la habitación
        const optionsWithAmenities = await Promise.all(options.map(async (option) => {
          const amenities = await this.dataSource.query(`
            SELECT 
              a.id,
              a.value,
              a.cost,
              a.description,
              ra.availability_level
            FROM amenities a
            JOIN room_amenities ra ON a.id = ra.amenity_id
            WHERE a.amenity_option_id = ? AND ra.room_id = ?
          `, [option.id, roomId]);

          return {
            id: option.id,
            name: option.name,
            amenities: amenities,
          };
        }));

        // Filtrar opciones que tengan amenidades
        const filteredOptions = optionsWithAmenities.filter(option => option.amenities.length > 0);

        return {
          id: category.id,
          name: category.name,
          options: filteredOptions,
        };
      }));

      // Filtrar categorías que tengan opciones
      return result.filter(category => category.options.length > 0);
    } catch (error) {
      throw new Error(`Error al obtener las amenidades de la habitación: ${error.message}`);
    }
  }
}