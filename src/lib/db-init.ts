import { PrismaClient } from '@prisma/client';

let schemaEnsured = false;

export async function ensureDbSchema(prisma: PrismaClient): Promise<void> {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserAccount" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UserAccount_email_key" ON "UserAccount"("email");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserWorkspace" (
        "id" TEXT NOT NULL,
        "email" TEXT,
        "name" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'Plano pessoal',
        "monthlySalaryCents" INTEGER NOT NULL DEFAULT 0,
        "salaryDay" INTEGER NOT NULL DEFAULT 5,
        "monthlyBudgetCents" INTEGER NOT NULL DEFAULT 0,
        "emergencyGoalCents" INTEGER NOT NULL DEFAULT 33000,
        "theme" TEXT NOT NULL DEFAULT 'dark',
        "hideValues" BOOLEAN NOT NULL DEFAULT false,
        "lastUsedAccountId" TEXT,
        "stateJson" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserWorkspace_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserWorkspace" ADD COLUMN IF NOT EXISTS "email" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BankAccount" (
        "id" TEXT NOT NULL,
        "accountKey" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "initialBalanceCents" INTEGER NOT NULL DEFAULT 0,
        "limitCents" INTEGER NOT NULL DEFAULT 200000,
        "closingDay" INTEGER NOT NULL DEFAULT 5,
        "dueDay" INTEGER NOT NULL DEFAULT 12,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "BankAccount_userId_idx" ON "BankAccount"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Transaction" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "amountCents" INTEGER NOT NULL,
        "description" TEXT NOT NULL,
        "tag" TEXT NOT NULL DEFAULT '',
        "categoryId" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "method" TEXT NOT NULL,
        "externalId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    schemaEnsured = true;
  } catch (err) {
    console.warn('[Farol DB] ensureDbSchema warning:', err);
  }
}
