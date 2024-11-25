import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConsumptionsService } from './consumptions.service';
import { CreateConsumptionDTO } from './dtos/create.consumption';
import { ChangeConsumptionDTO } from './dtos/change.consumption';
import { ConsumptionEntity } from './consumption.entity';
import { BookingEntity } from 'src/bookings/booking.entity';

@Controller('consumptions')
export class ConsumptionsController {
    constructor(private readonly service: ConsumptionsService) {}

    @Post('add')
    async add(@Body() body: CreateConsumptionDTO): Promise<ConsumptionEntity> {
        return await this.service.add(body);
    }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<ConsumptionEntity> {
        return await this.service.findById(id);
    }

    @Get('booking/:bookingId')
    async findAllByBookingId(@Param('bookingId') bookingId: number): Promise<ConsumptionEntity[]> {
        return await this.service.findAllByBookingId(bookingId);
    }
    
    @Get()
    async findAll(): Promise<ConsumptionEntity[]> {
        return await this.service.findAll();
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() body: ChangeConsumptionDTO): Promise<ConsumptionEntity> {
        return await this.service.update(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<Object> {
        return await this.service.delete(id);
    }
}
