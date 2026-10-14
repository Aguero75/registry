import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "@/lib/env";

export const db = drizzle(env.DATABASE_URL);
