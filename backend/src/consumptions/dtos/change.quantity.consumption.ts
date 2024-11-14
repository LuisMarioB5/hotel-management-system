import { IsNotEmpty, IsNumber } from "class-validator";

export class ChangeQuantityConsumptionDTO {
    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}