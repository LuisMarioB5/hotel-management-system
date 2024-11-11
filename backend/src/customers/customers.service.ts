import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './customer.entity';
import { CreateCustomerDTO } from './dtos/create-customer.dto';
import { UpdateCustomerDTO } from './dtos/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>,
  ) {}

  async create(customer: CreateCustomerDTO): Promise<CustomerEntity> {
    const newRoom = this.repository.create(customer);
    return this.repository.save(newRoom);
  }

  async findAll(): Promise<CustomerEntity[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<CustomerEntity> {
    const customer = await this.repository.findOne({ where: { id } });
    if (!customer) {
      this.throwCustomerNotFoundException(id);
    }
    return customer;
  }

  async findByDocumentNumber(documentNumber: string): Promise<CustomerEntity> {
    const customer = await this.repository.findOne({ where: { documentNumber } });
    if (!customer) {
      throw new NotFoundException(`Cliente con el número de documento ${documentNumber} no encontrado`);
    }
    return customer;
  }

  async update(id: number, updateCustomerDTO: UpdateCustomerDTO): Promise<CustomerEntity> {
    const customer = await this.findById(id);
    Object.assign(customer, updateCustomerDTO);
    return this.repository.save(customer);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      this.throwCustomerNotFoundException(id);
    }
  }

  private throwCustomerNotFoundException(id: number) {
    throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
  }
}
