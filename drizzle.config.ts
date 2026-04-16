import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: isDev,
  strict: isDev,
});
