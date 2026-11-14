# Farol Finanças (Next.js + Vercel + PostgreSQL + Open Finance)

Dashboard financeiro pessoal com tema **Dark Glass**, lançamento rápido em até 3 toques, faturas com regra de fechamento, categorias com regras automáticas, recorrências, fluxo de caixa detalhado, projeção 3M/6M/12M, patrimônio (% CDB/CDI) e rotas prontas para **PostgreSQL na Vercel** e **Open Finance (Pluggy)**.

## Stack
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript
- **Banco de Dados:** PostgreSQL via Prisma (`prisma/schema.prisma`) — compatível com **Vercel Postgres / Neon**
- **Open Finance:** API Routes em `/api/open-finance/connect-token` e `/api/open-finance/webhook` (Pluggy)
- **Fallback automático:** caso `DATABASE_URL` ainda não esteja configurada, o app opera normalmente via `localStorage` no navegador.

## Como publicar na Vercel
1. Suba este repositório para o seu **GitHub**.
2. Na **Vercel**, importe o repositório e crie um banco **Postgres (Neon)** na aba **Storage** (isso injeta `DATABASE_URL` automaticamente).
3. *(Opcional — Open Finance)* Adicione as variáveis de ambiente na Vercel:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`
   - `PLUGGY_WEBHOOK_SECRET`
4. Rode `npx prisma db push` (ou configure o Build Command para `npx prisma db push && npm run build`).

## Rodando localmente
```bash
npm install
npm run dev
```
