import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumptionEntity } from './consumption.entity';
import { Repository } from 'typeorm';
import { CreateConsumptionDTO } from './dtos/create.consumption';
import { BookingsService } from 'src/bookings/bookings.service';
import { ProductsService } from 'src/products/products.service';
import { ChangeConsumptionDTO } from './dtos/change.consumption';

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

    private throwConsumptionNotFoundException(id: number): never {
        throw new NotFoundException(`El consumo con ID ${id} no fue encontrado`);
    }
}
