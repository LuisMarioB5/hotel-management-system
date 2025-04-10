import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseInitializerService implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.initializeStoredProcedures();
  }

  private async initializeStoredProcedures() {
    try {
      // Leer el script SQL
      const sqlScriptPath = path.join(__dirname, 'init.sql');
      const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

      // Dividir el script en comandos individuales (por DELIMITER)
      const commands = sqlScript.split('DELIMITER //');
      for (let command of commands) {
        command = command.trim();
        if (!command) continue;

        // Restaurar el DELIMITER al final de cada comando
        if (!command.endsWith('DELIMITER ;')) {
          command = command.replace(/END\s*;/, 'END //\nDELIMITER ;');
        }

        // Ejecutar el comando
        await this.dataSource.query(command);
      }

      console.log('Procedimientos almacenados inicializados correctamente.');
    } catch (error) {
      console.error('Error al inicializar procedimientos almacenados:', error.message);
      throw new Error('No se pudieron inicializar los procedimientos almacenados.');
    }
  }
}