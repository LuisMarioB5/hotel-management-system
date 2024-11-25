import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { ConsumptionAvailability } from "../consumption.entity";

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

    @IsEnum(ConsumptionAvailability, {
        message: 'La disponibilidad deber ser un valor válido (PENDIENTE, SEPARADO)'
    })
    @IsNotEmpty()
    availability: ConsumptionAvailability;
}