import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const DEVELOPMENT_JWT_SECRET = 'azaam_default_jwt_secret_key_2026_dev';
const DEVELOPMENT_MONGODB_URI = 'mongodb://127.0.0.1:27017/azaam_medics_db';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1).default(DEVELOPMENT_MONGODB_URI),
  JWT_SECRET: z.string().min(1).default(DEVELOPMENT_JWT_SECRET),
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

  R2_ENDPOINT: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),

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

// Production must fail closed. Never allow the application to boot with
// development credentials or an unrestricted cross-origin policy.
if (env.NODE_ENV === 'production') {
  const productionErrors: string[] = [];

  if (env.JWT_SECRET === DEVELOPMENT_JWT_SECRET || env.JWT_SECRET.length < 32) {
    productionErrors.push('JWT_SECRET must be explicitly configured and at least 32 characters long');
  }

  if (env.CORS_ORIGIN.trim() === '*') {
    productionErrors.push('CORS_ORIGIN must be an explicit trusted origin in production');
  }

  if (env.MONGODB_URI === DEVELOPMENT_MONGODB_URI) {
    productionErrors.push('MONGODB_URI must be explicitly configured in production');
  }

  if (productionErrors.length > 0) {
    throw new Error(`Unsafe production environment configuration: ${productionErrors.join('; ')}`);
  }
}
