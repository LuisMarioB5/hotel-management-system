import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateTaskDTO } from './dtos/create.task.dto';
import { AssignTaskDTO } from './dtos/assign.task.dto';
import { TaskStatus, TaskType } from './maintenance-task.entity';

@Controller('housekeeping/tasks')
export class HousekeepingController {
  constructor(private readonly service: HousekeepingService) {}

  @Post()
  create(@Body() dto: CreateTaskDTO) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: TaskStatus,
    @Query('type') type?: TaskType,
    @Query('roomId') roomId?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.service.findAll({
      status,
      type,
      roomId: roomId ? parseInt(roomId, 10) : undefined,
      assignedToId: assignedToId ? parseInt(assignedToId, 10) : undefined,
    });
  }

  @Get('enums/values')
  getEnumsValues() {
    return this.service.getEnumValues();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Patch(':id/assign')
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignTaskDTO) {
    return this.service.assign(id, dto.userId);
  }

  @Patch(':id/start')
  start(@Param('id', ParseIntPipe) id: number) {
    return this.service.start(id);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.service.complete(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }
}
