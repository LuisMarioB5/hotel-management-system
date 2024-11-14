import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConsumptionsService } from './consumptions.service';
import { CreateConsumptionDTO } from './dtos/create.consumption';
import { ChangeQuantityConsumptionDTO } from './dtos/change.quantity.consumption';
import { ConsumptionEntity } from './consumption.entity';

@Controller('consumptions')
export class ConsumptionsController {
    constructor(private readonly service: ConsumptionsService) {}

    @Post('add')
    async add(@Body() body: CreateConsumptionDTO): Promise<ConsumptionEntity> {
        return this.service.add(body);
    }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<ConsumptionEntity> {
        return this.service.findById(id);
    }

    @Get('booking/:bookingId')
    async findAllByBookingId(@Param('bookingId') bookingId: number): Promise<ConsumptionEntity[]> {
        return this.service.findAllByBookingId(bookingId);
    }
    
    @Get()
    async findAll(): Promise<ConsumptionEntity[]> {
        return this.service.findAll();
    }

    @Patch(':id')
    async updateQuantity(@Param('id') id: number, @Body() body: ChangeQuantityConsumptionDTO): Promise<ConsumptionEntity> {
        return this.service.updateQuantity(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<Object> {
        return this.service.delete(id);
    }
}
