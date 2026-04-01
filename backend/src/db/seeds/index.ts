import mongoose from 'mongoose';

import User from '@/api/users/user.model';
import { config } from '@/config';
import { logger } from '@/services';

(async () => {
  try {
    console.info('=======seeding data===========');
    await mongoose.connect(config.mongodb.url);

    const adminEmail = config.admin.email;
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        fullName: config.admin.name,
        email: adminEmail,
        password: config.admin.password,
        role: 'admin',
      });
      console.info(`Created admin user: ${adminEmail}`);
    } else {
      console.info('Admin user already exists');
    }

    await mongoose.disconnect();
    console.info('=======seeded data was successfully===========');
  } catch (error) {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  }
})();
