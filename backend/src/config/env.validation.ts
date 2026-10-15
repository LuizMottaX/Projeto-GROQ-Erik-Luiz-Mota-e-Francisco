import Joi from 'joi';

/**
 * Valida as variáveis do .env da raiz na inicialização.
 * A aplicação não sobe se alguma obrigatória estiver ausente ou inválida.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().default('127.0.0.1'),
  DB_PORT: Joi.number().port().default(5433),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  GROQ_API_KEY: Joi.string().required(),
  GROQ_MODEL: Joi.string().default('whisper-large-v3-turbo'),

  ADMIN_NAME: Joi.string().default('Administrador'),
  ADMIN_EMAIL: Joi.string().email({ tlds: false }).required(),
  ADMIN_PASSWORD: Joi.string().min(8).required(),
});
