import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumptionEntity } from './consumption.entity';
import { Repository } from 'typeorm';
import { CreateConsumptionDTO } from './dtos/create.consumption';
import { BookingsService } from 'src/bookings/bookings.service';
import { ProductsService } from 'src/products/products.service';
import { ChangeConsumptionDTO } from './dtos/change.consumption';
import { query } from 'express';

@Injectable()
export class ConsumptionsService {
    constructor(
        @InjectRepository(ConsumptionEntity)
        private readonly repository: Repository<ConsumptionEntity>,
        private readonly bookingsService: BookingsService,
        private readonly productsService: ProductsService,
    ) {}

    async add(c: CreateConsumptionDTO): Promise<ConsumptionEntity> {
        const booking = await this.bookingsService.findById(c.bookingId);
        const product = await this.productsService.findById(c.productId);

        const consumption = this.repository.create({
            booking,
            product,
            quantity: c.quantity,
            unitPrice: product.unitPrice,
            subtotal: c.quantity * product.unitPrice,
            availability: c.availability,
        });

        return this.repository.save(consumption);
    }

    async findById(id: number): Promise<ConsumptionEntity> {
        const consumption = await this.repository.findOne({ 
            where: { id },
            relations: ['booking', 'product']
        });
        if (!consumption) {
            this.throwConsumptionNotFoundException(id);
        }
        
        return consumption;
    }

    async findAllByBookingId(bookingId: number): Promise<ConsumptionEntity[]> {
        return this.repository.find({
            where: { booking: { id: bookingId } },
            relations: ['product'],
        });
    }

    async findAll(): Promise<ConsumptionEntity[]> {
        return this.repository.find({
            relations: ['booking', 'product'],
        });
    }

    async update(id: number, c: ChangeConsumptionDTO): Promise<ConsumptionEntity> {
        const consumption = await this.findById(id);
        
        if(c.quantity) {
            consumption.quantity = c.quantity;
            consumption.subtotal = c.quantity * consumption.unitPrice; // Actualiza el subtotal
        }

        if(c.availability) consumption.availability = c.availability;
        
        return this.repository.save(consumption);
    }

    async delete(id: number): Promise<Object> {
        const booking = (await this.findById(id)).booking;
        const result = await this.repository.delete(id);

        if (result.affected === 0) {
            this.throwConsumptionNotFoundException(id);
        }

        return { message: `El consumo con ID ${id} ha sido eliminado correctamente` };
    }

    async getTopConsumptions(limit: number, category: string): Promise<any[]> {
        const queries = this.repository
            .createQueryBuilder('consumption')
            .leftJoinAndSelect('consumption.product', 'product') // Relación con el producto
            .select([
                'product.id AS product_id', // Id del producto
                'product.name AS product_name', // Nombre del producto
                'product.category AS product_category', // Categoria del producto
                'consumption.unitPrice AS unitPrice', // Precio unitario del consumo (precio del producto al momento de consumir)
                'SUM(consumption.quantity) AS "quantity"', // Total de cantidades consumidas'
            ]);

            if(category && category.toUpperCase() !== 'TODOS') {
                queries.where('product.category = :category', { category: category.toUpperCase() })
            }

            queries
                .groupBy('product.id') // Agrupación
                .addGroupBy('product.name')
                .addGroupBy('product.category')
                .addGroupBy('consumption.unitPrice')
                .orderBy('quantity', 'DESC') // Ordenar por cantidad descendente
                .limit(limit); // Limitar el top
            
            const rawResults = await queries.getRawMany(); // Obtener los resultados como objetos crudos
            
            return rawResults.map(query => ({
                product: {
                    id: query.product_id,
                    name: query.product_name,
                    category: query.product_category,
                },
                unitPrice: query.unitPrice,
                quantity: query.quantity,
            }));
    }

    private throwConsumptionNotFoundException(id: number): never {
        throw new NotFoundException(`El consumo con ID ${id} no fue encontrado`);
    }
}
