import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient, UserRole, UserStatus } from '../src/generated/prisma/client';
import { createUuidV7 } from '../src/platform/ids/uuid-v7';
import { toTitleCase } from '../src/shared/text';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = toTitleCase(process.env.SEED_ADMIN_NAME ?? 'Root Admin');

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required for seeding',
    );
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: {
          name,
          passwordHash,
          role: UserRole.admin,
          status: UserStatus.active,
          phone: null,
        },
      });
      console.log(`Updated seed admin: ${email}`);
      return;
    }

    await prisma.user.create({
      data: {
        id: createUuidV7(),
        name,
        email,
        passwordHash,
        role: UserRole.admin,
        status: UserStatus.active,
        phone: null,
      },
    });
    console.log(`Created seed admin: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
