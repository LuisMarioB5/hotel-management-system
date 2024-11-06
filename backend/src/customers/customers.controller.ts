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

  @Get(':param')
  async findCustomer(@Param('param') param: string): Promise<CustomerEntity> {
    if (!isNaN(Number(param))) {
      // Es un número, tratar como ID
      return this.service.findById(Number(param));
    } else {
      // Es una cadena, tratar como el número de documento
      return this.service.findByDocumentNumber(param);
    }
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
