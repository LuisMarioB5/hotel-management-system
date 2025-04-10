import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class OffersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async generateOffers(numCustomers: number, isFrequentGuest: number) {
    try {
      const [results] = await this.dataSource.query(
        'CALL GenerateRoomAssignments(?, ?)',
        [numCustomers, isFrequentGuest],
      );

      // Asegurarnos de que los resultados sean un array plano
      let offers = results;
      if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
        offers = results[0]; // Si los resultados están anidados, tomamos el primer elemento
      }

      return offers;
    } catch (error) {
      throw new Error(`Error al generar ofertas: ${error.message}`);
    }
  }
}