import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TaskPriority, TaskType } from '../maintenance-task.entity';

export class CreateTaskDTO {
  @IsNumber()
  @IsNotEmpty()
  roomId: number;

  @IsEnum(TaskType, {
    message: 'El tipo de tarea debe ser un valor válido (LIMPIEZA o MANTENIMIENTO)',
  })
  @IsNotEmpty()
  type: TaskType;

  @IsEnum(TaskPriority, {
    message: 'La prioridad debe ser un valor válido (BAJA, MEDIA o ALTA)',
  })
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  assignedToId?: number;

  @IsNumber()
  @IsOptional()
  createdById?: number;
}
