# infoware_oms_api

Mini OMS API — TypeScript + Express + Prisma

Setup

1. Copy `.env.example` to `.env` and set DATABASE_URL and JWT_SECRET.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate:dev` or `npx prisma db push`
5. Start dev server: `npm run dev`

API

- POST /api/v1/auth/register
- POST /api/v1/auth/login

