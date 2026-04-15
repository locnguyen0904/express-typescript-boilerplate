import argon2 from 'argon2';
import { eq } from 'drizzle-orm';

import { config } from '@/config';
import { users } from '@/db/schema';
import { logger } from '@/services';
import { db } from '@/services/database.service';
import { pool } from '@/services/database.service';

(async () => {
  try {
    console.info('=======seeding data===========');
    const client = await pool.connect();

    const adminEmail = config.admin.email;
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail));

    if (!existingAdmin) {
      const hashedPassword = await argon2.hash(config.admin.password!, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      await db.insert(users).values({
        fullName: config.admin.name,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.info(`Created admin user: ${adminEmail}`);
    } else {
      console.info('Admin user already exists');
    }

    client.release();
    await pool.end();
    console.info('=======seeded data was successfully===========');
  } catch (error) {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  }
})();
