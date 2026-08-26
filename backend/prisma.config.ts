import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Dummy URL allows `prisma generate` without a live database.
    url:
      process.env.DATABASE_URL ??
      'postgresql://plaschema:plaschema@localhost:5432/plaschema',
  },
});
