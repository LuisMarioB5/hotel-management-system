import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDTO } from './dtos/create.product.dto';
import { ProductEntity } from './product.entity';
import { UpdateProductDTO } from './dtos/update.product.dto';

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
        return this.service.findAll();
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
    async update(@Param('id') id: number, @Body() p: UpdateProductDTO): Promise<ProductEntity> {
        return this.service.update(id, p);
    }

    @Get('enums/values')
    getEnumValues() {
        return this.service.getEnumValues();
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<Object> {
        await this.service.delete(id);
        return { message: `El producto con ID ${id} se ha eliminado correctamente` };
    }
}
