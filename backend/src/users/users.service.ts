import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDTO } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(u: CreateUserDTO): Promise<UserEntity> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(u.password, salt);
    const newUser = this.repository.create({
      username: u.username,
      password: hashedPassword,
      role: u.role,
      isActive: u.isActive,
    });
    return this.repository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.repository.find();
  }

  async findById(id: number): Promise<UserEntity> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      this.throwUserNotFoundException(id);
    }
    return user;
  }

  async findByUsername(username: string): Promise<UserEntity> {
    const user = await this.repository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException(`Usuario con Username ${username} no encontrado`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    if(updateUserDto.password !== null) {
      user.password = await bcrypt.hash(updateUserDto.password, await bcrypt.genSalt());
    }
    return this.repository.save(user);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      this.throwUserNotFoundException(id);
    }
  }

  private throwUserNotFoundException(id: number) {
    throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }
}
