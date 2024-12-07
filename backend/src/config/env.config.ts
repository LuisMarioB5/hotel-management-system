export class EnvConfig {
    // Base de datos
    static readonly DB_HOST = process.env.DB_HOST;
    static readonly DB_PORT = parseInt(process.env.DB_PORT, 10);
    static readonly DB_USER = process.env.DB_USER;
    static readonly DB_PWD = process.env.DB_PWD;
    static readonly DB_NAME = process.env.DB_NAME;

    // Generación del JWT
    static readonly JWT_SECRET = process.env.JWT_SECRET;
    static readonly JWT_TIME_TO_EXPIRE = process.env.JWT_TIME_TO_EXPIRE || '1h';
}
  