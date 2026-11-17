import { execSync } from 'node:child_process';

if (process.env.DATABASE_URL) {
  console.log('[Farol Build] DATABASE_URL detected — pushing Prisma schema to PostgreSQL...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('[Farol Build] Prisma schema synced successfully.');
  } catch (err) {
    console.warn('[Farol Build] prisma db push warning (runtime ensureDbSchema will handle it):', err?.message || err);
  }
} else {
  console.log('[Farol Build] No DATABASE_URL in build environment — skipping prisma db push.');
}
