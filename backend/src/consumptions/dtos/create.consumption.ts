import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class CreateConsumptionDTO {
    @IsNumber()
    @IsNotEmpty()
    bookingId: number;

    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    quantity: number;
}