import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listAmenities() {
    try {
      const categories = await this.dataSource.query(`
        SELECT 
          id,
          name
        FROM amenity_categories
        ORDER BY name
      `);

      const result = await Promise.all(categories.map(async (category) => {
        const options = await this.dataSource.query(`
          SELECT 
            ao.id,
            ao.name
          FROM amenity_options ao
          WHERE ao.id_category = ?
          ORDER BY ao.name
        `, [category.id]);

        const optionsWithAmenities = await Promise.all(options.map(async (option) => {
          const amenities = await this.dataSource.query(`
            SELECT 
              a.id,
              a.value,
              a.cost,
              a.description
            FROM amenities a
            WHERE a.amenity_option_id = ?
          `, [option.id]);

          return {
            id: option.id,
            name: option.name,
            amenities: amenities,
          };
        }));

        return {
          id: category.id,
          name: category.name,
          options: optionsWithAmenities,
        };
      }));

      return result;
    } catch (error) {
      throw new Error(`Error al listar las amenidades: ${error.message}`);
    }
  }
}