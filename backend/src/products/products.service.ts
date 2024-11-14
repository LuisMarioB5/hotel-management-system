import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductEntity } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDTO } from './dtos/create-product.dto';
import { UpdateProductDTO } from './dtos/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(ProductEntity)
        private readonly repository: Repository<ProductEntity>,
    ) {}

    async create(p: CreateProductDTO): Promise<ProductEntity> {
        const newProduct = this.repository.create(p);
        return this.repository.save(newProduct);
    }

    async findByAll(): Promise<ProductEntity[]> {
        return this.repository.find();
    }

    async findById(id: number): Promise<ProductEntity> {
        const product = this.repository.findOne({ where: { id } });
        if(!product) {
            this.throwProductNotFoundException('id', id.toString());
        }
        return product;
    }

    async findByName(name: string): Promise<ProductEntity> {
        const product = this.repository.findOne({ where: { name } });
        if(!product) {
            this.throwProductNotFoundException('name', name);
        }
        return product;
    }

    async update(id: number, p: UpdateProductDTO): Promise<ProductEntity> {
        const product = await this.findById(id);

        if(p.name !== null) product.name = p.name;
        if(p.unitPrice !== null) product.unitPrice = p.unitPrice;
        if(p.quantity !== null) product.quantity = p.quantity;
        if(p.details !== null) product.details = p.details;
        if(p.isActive !== null) product.isActive = p.isActive;
      
        return await this.repository.save(product);
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if(result.affected === 0) {
            this.throwProductNotFoundException('id', id.toString());
        }
    }

    private throwProductNotFoundException(varName: string, varValue: string) {
        throw new NotFoundException(`Producto con ${varName.toUpperCase()} '${varValue}' no encontrado`);
    }
}
