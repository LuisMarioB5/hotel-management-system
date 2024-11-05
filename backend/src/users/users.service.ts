import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(username: string, plainPassword: string, role: string, isActive: boolean): Promise<UserEntity> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    const newUser = this.repository.create({ username, password: hashedPassword, role, isActive });
    return this.repository.save(newUser);
  }
  
  async findAll(): Promise<UserEntity[]> {
    return this.repository.find();
  }
  
  async findById(id: number): Promise<UserEntity | undefined> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }
  
    async findByUsername(username: string): Promise<UserEntity | undefined> {
      const user = await this.repository.findOne({ where: { username } });
      if (!user) {
        throw new NotFoundException(`Usuario con Username ${username} no encontrado`);
      }
      return user;
    }
}
