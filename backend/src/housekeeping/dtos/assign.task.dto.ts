import { IsNotEmpty, IsNumber } from 'class-validator';

export class AssignTaskDTO {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
