import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/azaam_medics_db'),
  JWT_SECRET: z.string().default('azaam_default_jwt_secret_key_2026_dev'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGIN: z.string().default('*'),

  MAX_FILE_SIZE: z.string().default('10485760'),
  STORAGE_PROVIDER: z.string().default('local'),
  STORAGE_BUCKET: z.string().default('local-documents'),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'azaam_default_jwt_secret_key_2026_dev') {
    console.warn('[Security Warning] Using default JWT_SECRET in production. Set JWT_SECRET in environment for production deployments.');
  }

  if (env.CORS_ORIGIN === '*') {
    console.warn('[Security Warning] CORS_ORIGIN is set to * in production.');
  }
}
