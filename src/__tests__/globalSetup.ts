import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('\n[Global Setup] Pushing database schema to test database...');
  execSync('npx drizzle-kit push --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL:
        'postgresql://admin:password123@localhost:5433/express-typescript-boilerplate-test',
    },
  });
}
