import { z } from 'zod'

/**
 * Environment parsing. Every variable the server reads is declared here so a
 * missing/invalid value fails loudly at boot instead of at the first request.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  APP_URL: z.string().url().default('http://localhost:5173/Filmvault/'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  EMAIL_MODE: z.enum(['smtp', 'console']).default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Filmvault <no-reply@localhost>'),

  TRUST_PROXY: z.coerce.number().int().positive().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid server environment:\n${issues}`)
}

export const env = parsed.data

if (env.NODE_ENV === 'production') {
  const problems: string[] = []
  if (!process.env.JWT_SECRET) problems.push('JWT_SECRET must be set explicitly')
  if (env.EMAIL_MODE !== 'smtp') problems.push('EMAIL_MODE must be "smtp" in production')
  if (!env.SMTP_HOST) problems.push('SMTP_HOST is required in production')
  if (problems.length > 0) {
    throw new Error(`Unsafe production configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  }
}

export const isProduction = env.NODE_ENV === 'production'