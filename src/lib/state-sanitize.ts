import type { PrismaClient } from '@prisma/client';
import { sanitizeWorkspaceInstallments } from './farol/installments';

export {
  addMonthsYM,
  clampDayToYM,
  clampIsoDate,
  monthDiffYM,
  normalizeTxText,
} from './farol/formatters';

export {
  INSTALLMENT_DESC_RE,
  computeInvoiceYMWithAccounts,
  hasDuplicateInstallmentTx,
  parseInstallmentMeta,
  sanitizeWorkspaceInstallments,
  type ParsedInstallment,
  type SanitizeResult,
} from './farol/installments';

let allWorkspacesSanitizedPromise: Promise<void> | null = null;

export function sanitizeAllWorkspacesOnce(prisma: PrismaClient): Promise<void> {
  if (allWorkspacesSanitizedPromise) return allWorkspacesSanitizedPromise;

  allWorkspacesSanitizedPromise = (async () => {
    try {
      const rows = await prisma.userWorkspace.findMany({
        select: { id: true, stateJson: true },
      });

      for (const row of rows) {
        if (!row.stateJson) continue;
        try {
          const parsed = JSON.parse(row.stateJson);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
          const result = sanitizeWorkspaceInstallments(parsed);
          if (result.changed) {
            await prisma.userWorkspace.update({
              where: { id: row.id },
              data: { stateJson: JSON.stringify(result.state) },
            });
          }
        } catch {
          // Ignora registro individual malformado para não interromper a limpeza dos demais
        }
      }
    } catch (err) {
      console.warn('[Farol Sanitize] Batch workspace cleanup warning:', err);
      allWorkspacesSanitizedPromise = null;
    }
  })();

  return allWorkspacesSanitizedPromise;
}
