import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDTO } from './dtos/create-product.dto';
import { ProductEntity } from './product.entity';
import { UpdateBookingDTO } from 'src/bookings/dtos/update-booking.dto';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly service: ProductsService,
    ) {}

    @Post()
    async create(@Body() b: CreateProductDTO): Promise<ProductEntity> {
        return this.service.create(b);
    }

    @Get()
    async findAll(): Promise<ProductEntity[]> {
        return this.service.findByAll();
    }

    @Get(':id')
    async findById(@Param('id') id:number): Promise<ProductEntity> {
        return this.service.findById(id);
    }

    @Get('name/:name')
    async findByName(@Param('name') name: string): Promise<ProductEntity> {
        return this.service.findByName(name);
    }

    @Patch(':id')
    async update(@Param('id') id: number, p: UpdateBookingDTO): Promise<ProductEntity> {
        return this.service.update(id, p);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<void> {
        return this.service.delete(id);
    }
}
