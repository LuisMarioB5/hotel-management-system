import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDTO } from './dtos/create-customer.dto';
import { CustomerEntity } from './customer.entity';
import { UpdateCustomerDTO } from './dtos/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post('register')
  async register(@Body() body: CreateCustomerDTO) {
    return this.service.create(body);
  }

  @Get()
  async findAll(): Promise<CustomerEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<CustomerEntity> {
    return this.service.findById(id);
  }

  @Get('document/:documentNumber')
  async findByDocumentNumber(@Param('documentNumber') documentNumber: string): Promise<CustomerEntity> {
    return this.service.findByDocumentNumber(documentNumber);
  }

  @Get('enums/values')
  getEnumValues() {
    return this.service.getEnumValues();
  }

  @Patch(':id')
  async updateCustomer(@Param('id') id: number, @Body() updateCustomerDTO: UpdateCustomerDTO) {
    return this.service.update(id, updateCustomerDTO);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: number) {
    await this.service.delete(id);
    return { message: `Cliente con ID ${id} eliminado exitosamente` }
  }
}
