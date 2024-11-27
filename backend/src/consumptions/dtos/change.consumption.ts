import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ConsumptionAvailability } from "../consumption.entity";

export class ChangeConsumptionDTO {
    @IsNumber()
    @IsOptional()
    quantity?: number;

    @IsEnum(ConsumptionAvailability, {
        message: 'La disponibilidad debe ser un valor válido (PENDIENTE, SEPARADO)'
    })
    @IsOptional()
    availability?: ConsumptionAvailability;
}