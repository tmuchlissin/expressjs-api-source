// Centralized environment configuration validated with Zod (fails fast on missing vars).
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3007),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BEARER_TOKEN: z.string().min(1, "BEARER_TOKEN is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const config = Object.freeze({
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  bearerToken: parsed.data.BEARER_TOKEN,
});

export type Config = typeof config;
export default config;

