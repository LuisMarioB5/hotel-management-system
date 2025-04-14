import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async savePreferences(formData: any) {
    const { customer_id, min_cost, max_cost, weight_level, amenities } = formData;

    if (!customer_id || customer_id <= 0) {
      throw new Error('El ID del cliente no es válido');
    }

    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Actualizar o insertar en client_configuration
        await transactionalEntityManager.query(
          `
          INSERT INTO client_configuration (customer_id, weight_level, min_cost, max_cost)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            weight_level = VALUES(weight_level),
            min_cost = VALUES(min_cost),
            max_cost = VALUES(max_cost)
          `,
          [customer_id, weight_level || 0, min_cost, max_cost],
        );

        // Obtener las amenidades existentes
        const existingAmenities = await transactionalEntityManager.query(
          `
          SELECT amenity_id, preference_level
          FROM client_amenities
          WHERE customer_id = ?
          `,
          [customer_id],
        );

        // Crear un mapa de amenidades existentes para comparación
        const existingAmenitiesMap = new Map<number, number>(
          existingAmenities.map(amenity => [amenity.amenity_id, amenity.preference_level]),
        );

        // Preparar listas para insertar, actualizar y eliminar
        const amenitiesToInsert: any[] = [];
        const amenitiesToUpdate: any[] = [];
        const amenitiesToDelete: number[] = [];

        // Procesar las nuevas amenidades
        const newAmenityIds = new Set<number>();
        if (amenities && amenities.length > 0) {
          for (const amenity of amenities) {
            const { amenity_id, preference_level } = amenity;
            newAmenityIds.add(amenity_id);

            if (existingAmenitiesMap.has(amenity_id)) {
              // Amenidad existente: verificar si el preference_level cambió
              const existingPreferenceLevel = existingAmenitiesMap.get(amenity_id);
              if (existingPreferenceLevel !== preference_level) {
                amenitiesToUpdate.push([preference_level, customer_id, amenity_id]);
              }
            } else {
              // Nueva amenidad: insertar
              amenitiesToInsert.push([customer_id, amenity_id, preference_level]);
            }
          }
        }

        // Identificar amenidades a eliminar (las que estaban en la BD pero no en las nuevas)
        existingAmenitiesMap.forEach((_, amenity_id) => {
          if (!newAmenityIds.has(amenity_id)) {
            amenitiesToDelete.push(amenity_id);
          }
        });

        // Ejecutar los cambios
        // 1. Insertar nuevas amenidades
        if (amenitiesToInsert.length > 0) {
          await transactionalEntityManager.query(
            `
            INSERT INTO client_amenities (customer_id, amenity_id, preference_level)
            VALUES ?
            `,
            [amenitiesToInsert],
          );
        }

        // 2. Actualizar preferencias de amenidades existentes
        if (amenitiesToUpdate.length > 0) {
          for (const [preference_level, customer_id, amenity_id] of amenitiesToUpdate) {
            await transactionalEntityManager.query(
              `
              UPDATE client_amenities
              SET preference_level = ?
              WHERE customer_id = ? AND amenity_id = ?
              `,
              [preference_level, customer_id, amenity_id],
            );
          }
        }

        // 3. Eliminar amenidades que ya no están seleccionadas
        if (amenitiesToDelete.length > 0) {
          await transactionalEntityManager.query(
            `
            DELETE FROM client_amenities
            WHERE customer_id = ? AND amenity_id IN (?)
            `,
            [customer_id, amenitiesToDelete],
          );
        }
      });

      return { success: true, message: 'Preferencias guardadas exitosamente' };
    } catch (error) {
      throw new Error(`Error al guardar las preferencias: ${error.message}`);
    }
  }

  async getPreferences(customerId: number) {
    if (!customerId || customerId <= 0) {
      throw new Error('El ID del cliente no es válido');
    }

    try {
      const configuration = await this.dataSource.query(
        `
        SELECT weight_level, min_cost, max_cost
        FROM client_configuration
        WHERE customer_id = ?
        `,
        [customerId],
      );

      const amenities = await this.dataSource.query(
        `
        SELECT amenity_id, preference_level
        FROM client_amenities
        WHERE customer_id = ?
        `,
        [customerId],
      );

      return {
        configuration: configuration[0] || { weight_level: 0, min_cost: null, max_cost: null },
        amenities,
      };
    } catch (error) {
      throw new Error(`Error al obtener las preferencias: ${error.message}`);
    }
  }
}