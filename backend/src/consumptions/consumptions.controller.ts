import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ConsumptionsService } from './consumptions.service';
import { CreateConsumptionDTO } from './dtos/create.consumption';
import { ChangeQuantityConsumptionDTO } from './dtos/change.quantity.consumption';

@Controller('consumptions')
export class ConsumptionsController {
    constructor(private readonly service: ConsumptionsService) {}

    @Post('add')
    async add(@Body() body: CreateConsumptionDTO) {
        return this.service.add(body);
    }

    @Get(':id')
    async findById(@Param('id') id: number) {
        return this.service.findById(id);
    }

    @Get()
    async findAll() {
        return this.service.findAll();
    }

    @Patch(':id')
    async updateQuantity(@Param('id') id: number, @Body() body: ChangeQuantityConsumptionDTO) {
        return this.service.updateQuantity(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.service.delete(id);
    }
}
