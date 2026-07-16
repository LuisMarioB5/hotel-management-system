const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const ENV_PATH = path.join(__dirname, '..', 'backend', '.env');

const DEFAULTS = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_PWD: '',
  DB_NAME: 'hotel_management_db',
  JWT_TIME_TO_EXPIRE: '1h',
  PORT: '3000',
};

function parseEnvFile(content) {
  const values = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function ensureEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    console.log('[setup] backend/.env ya existe, no se modifica.');
    return parseEnvFile(fs.readFileSync(ENV_PATH, 'utf8'));
  }

  const values = {
    ...DEFAULTS,
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  };

  const content = [
    `DB_HOST=${values.DB_HOST}`,
    `DB_PORT=${values.DB_PORT}`,
    `DB_USER=${values.DB_USER}`,
    `DB_PWD=${values.DB_PWD}`,
    `DB_NAME=${values.DB_NAME}`,
    '',
    `JWT_SECRET=${values.JWT_SECRET}`,
    `JWT_TIME_TO_EXPIRE=${values.JWT_TIME_TO_EXPIRE}`,
    '',
    `PORT=${values.PORT}`,
    '',
  ].join('\n');

  fs.writeFileSync(ENV_PATH, content);
  console.log('[setup] backend/.env creado con valores por defecto (MySQL local sin contraseña).');
  return values;
}

async function ensureDatabase(env) {
  const host = env.DB_HOST || DEFAULTS.DB_HOST;
  const port = parseInt(env.DB_PORT || DEFAULTS.DB_PORT, 10);
  const user = env.DB_USER || DEFAULTS.DB_USER;
  const password = env.DB_PWD || '';
  const database = env.DB_NAME || DEFAULTS.DB_NAME;

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password });
  } catch (err) {
    console.error('\n[setup] No se pudo conectar a MySQL en ' + host + ':' + port + '.');
    console.error('[setup] Motivo: ' + err.message);
    console.error('\n[setup] Asegúrate de tener un servidor MySQL corriendo (Laragon, XAMPP, MySQL Server, etc.)');
    console.error('[setup] y de que las credenciales en backend/.env sean correctas.\n');
    process.exit(1);
  }

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4;`);
  console.log(`[setup] Base de datos "${database}" lista.`);
  await connection.end();
}

const SEED_PATH = path.join(__dirname, '..', 'backend', 'seed', 'hotel_management_db.sql');

async function seedDatabaseIfEmpty(env) {
  const host = env.DB_HOST || DEFAULTS.DB_HOST;
  const port = parseInt(env.DB_PORT || DEFAULTS.DB_PORT, 10);
  const user = env.DB_USER || DEFAULTS.DB_USER;
  const password = env.DB_PWD || '';
  const database = env.DB_NAME || DEFAULTS.DB_NAME;

  if (!fs.existsSync(SEED_PATH)) {
    return;
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
  });

  const [tables] = await connection.query('SHOW TABLES');
  if (tables.length > 0) {
    console.log('[setup] La base de datos ya tiene datos, se omite la carga de datos de ejemplo.');
    await connection.end();
    return;
  }

  console.log('[setup] Base de datos vacía: cargando datos de ejemplo (backend/seed/hotel_management_db.sql)...');
  const sql = fs.readFileSync(SEED_PATH, 'utf8');
  await connection.query(sql);
  console.log('[setup] Datos de ejemplo cargados correctamente.');
  await connection.end();
}

async function main() {
  const env = ensureEnvFile();
  await ensureDatabase(env);
  await seedDatabaseIfEmpty(env);
  console.log('[setup] Todo listo. Iniciando backend y frontend...\n');
}

main().catch((err) => {
  console.error('[setup] Error inesperado:', err);
  process.exit(1);
});
