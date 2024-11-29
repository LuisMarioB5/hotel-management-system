import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductCategory, ProductEntity } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDTO } from './dtos/create.product.dto';
import { UpdateProductDTO } from './dtos/update.product.dto';
import { getEnumValues } from 'src/utils/showEnum.values';
import { parseIsActive } from 'src/utils/utils';

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

    async findAll(): Promise<ProductEntity[]> {
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
        if(p.category !== null) product.category = p.category;
        if(p.isActive !== null) product.isActive = p.isActive;
      
        return await this.repository.save(product);
    }

    async delete(id: number): Promise<void> {
        const result = await this.repository.delete(id);
        if(result.affected === 0) {
            this.throwProductNotFoundException('id', id.toString());
        }
    }

    getEnumValues() {
      return getEnumValues({ ProductCategory });
    }

    getFilteredProductsByIsActiveAndCategory(isActive: string, category: string) {
        const query = this.repository.createQueryBuilder('product');

        // Filtrar por isActive si no es 'Todos'
        if(isActive !== 'Todos'){
            query.andWhere('product.isActive = :isActive', { isActive: parseIsActive(isActive) })
        }
        
        // Filtrar por category si no es 'Todos'
        if(category !== 'Todos'){
            query.andWhere('product.category = :category', { category: category.toUpperCase() })
        }

        return query.getMany();
    }

    private throwProductNotFoundException(varName: string, varValue: string) {
        throw new NotFoundException(`Producto con ${varName.toUpperCase()} '${varValue}' no encontrado`);
    }
}
