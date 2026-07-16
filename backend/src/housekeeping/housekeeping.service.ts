import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceTaskEntity, TaskStatus, TaskType } from './maintenance-task.entity';
import { CreateTaskDTO } from './dtos/create.task.dto';
import { RoomsService } from 'src/rooms/rooms.service';
import { UsersService } from 'src/users/users.service';
import { RoomStatus } from 'src/rooms/room.entity';
import { getEnumValues } from 'src/utils/showEnum.values';
import { TaskPriority } from './maintenance-task.entity';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(MaintenanceTaskEntity)
    private readonly repository: Repository<MaintenanceTaskEntity>,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateTaskDTO): Promise<MaintenanceTaskEntity> {
    const room = await this.roomsService.findById(dto.roomId);

    const task = this.repository.create({
      room,
      type: dto.type,
      priority: dto.priority || TaskPriority.MEDIA,
      description: dto.description,
      assignedTo: dto.assignedToId ? await this.usersService.findById(dto.assignedToId) : null,
      createdBy: dto.createdById ? await this.usersService.findById(dto.createdById) : null,
    });

    if (dto.type === TaskType.MANTENIMIENTO) {
      await this.roomsService.updateRoomStatus(room.id, RoomStatus.FUERA_DE_SERVICIO);
    }

    return this.sanitize(await this.repository.save(task));
  }

  async createCleaningTask(roomId: number): Promise<MaintenanceTaskEntity> {
    const room = await this.roomsService.findById(roomId);
    const task = this.repository.create({
      room,
      type: TaskType.LIMPIEZA,
      priority: TaskPriority.MEDIA,
    });
    return this.sanitize(await this.repository.save(task));
  }

  async findAll(filters: { status?: TaskStatus; type?: TaskType; roomId?: number; assignedToId?: number }): Promise<MaintenanceTaskEntity[]> {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.roomId) where.room = { id: filters.roomId };
    if (filters.assignedToId) where.assignedTo = { id: filters.assignedToId };

    const tasks = await this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return tasks.map((t) => this.sanitize(t));
  }

  async findById(id: number): Promise<MaintenanceTaskEntity> {
    const task = await this.repository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    return this.sanitize(task);
  }

  async assign(id: number, userId: number): Promise<MaintenanceTaskEntity> {
    const task = await this.findRaw(id);
    task.assignedTo = await this.usersService.findById(userId);
    return this.sanitize(await this.repository.save(task));
  }

  async start(id: number): Promise<MaintenanceTaskEntity> {
    const task = await this.findRaw(id);
    if (task.status !== TaskStatus.PENDIENTE) {
      throw new BadRequestException('Solo las tareas pendientes pueden iniciarse.');
    }
    task.status = TaskStatus.EN_PROGRESO;
    task.startedAt = new Date();
    return this.sanitize(await this.repository.save(task));
  }

  async complete(id: number): Promise<MaintenanceTaskEntity> {
    const task = await this.findRaw(id);
    if (task.status !== TaskStatus.EN_PROGRESO && task.status !== TaskStatus.PENDIENTE) {
      throw new BadRequestException('Solo las tareas pendientes o en proceso pueden completarse.');
    }
    task.status = TaskStatus.COMPLETADA;
    task.completedAt = new Date();

    if (task.type === TaskType.LIMPIEZA && task.room.status === RoomStatus.LIMPIEZA) {
      await this.roomsService.updateRoomStatus(task.room.id, RoomStatus.DISPONIBLE);
    } else if (task.type === TaskType.MANTENIMIENTO && task.room.status === RoomStatus.FUERA_DE_SERVICIO) {
      await this.roomsService.updateRoomStatus(task.room.id, RoomStatus.DISPONIBLE);
    }

    return this.sanitize(await this.repository.save(task));
  }

  async cancel(id: number): Promise<MaintenanceTaskEntity> {
    const task = await this.findRaw(id);
    if (task.status === TaskStatus.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una tarea ya completada.');
    }
    task.status = TaskStatus.CANCELADA;

    if (task.type === TaskType.MANTENIMIENTO && task.room.status === RoomStatus.FUERA_DE_SERVICIO) {
      await this.roomsService.updateRoomStatus(task.room.id, RoomStatus.DISPONIBLE);
    } else if (task.type === TaskType.LIMPIEZA && task.room.status === RoomStatus.LIMPIEZA) {
      await this.roomsService.updateRoomStatus(task.room.id, RoomStatus.DISPONIBLE);
    }

    return this.sanitize(await this.repository.save(task));
  }

  getEnumValues() {
    return getEnumValues({ TaskType, TaskPriority, TaskStatus });
  }

  private async findRaw(id: number): Promise<MaintenanceTaskEntity> {
    const task = await this.repository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Tarea con ID ${id} no encontrada`);
    return task;
  }

  private sanitize(task: MaintenanceTaskEntity): MaintenanceTaskEntity {
    if (task.assignedTo) delete (task.assignedTo as Partial<typeof task.assignedTo>).password;
    if (task.createdBy) delete (task.createdBy as Partial<typeof task.createdBy>).password;
    return task;
  }
}
