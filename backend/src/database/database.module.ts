import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseInitializerService } from './database-initializer.service';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [DatabaseInitializerService],
  exports: [DatabaseInitializerService],
})
export class DatabaseModule {}