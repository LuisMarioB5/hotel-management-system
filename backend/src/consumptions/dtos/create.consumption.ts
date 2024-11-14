import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateConsumptionDTO {
    @IsNumber()
    @IsNotEmpty()
    bookingId: number;

    @IsNumber()
    @IsNotEmpty()
    productId: number;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;
}