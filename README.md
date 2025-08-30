# Order Management System (OMS) API

TypeScript + Express + Prisma (PostgreSQL) OMS backend with role-based access, unit conversions (KG⇄GM, LT⇄ML), and real-time order status updates via WebSocket.

## Architecture (brief)

- Runtime: Node.js (ESM) + Express 5
- Data: PostgreSQL via Prisma ORM (`prisma/schema.prisma` + migrations)
- Modules: `features/` by domain (auth, products, orders, admin, units)
- AuthZ/AuthN: JWT auth middleware + role guard (`BUYER`, `SUPPLIER`, `ADMIN`)
- Orders: multi-item, stock checks, status history; stock deducts on APPROVED
- Units: conversions resolved per product base UOM; persisted in base UOM
- Realtime: Socket.IO broadcasts `order-status-updated` on status change
- Error handling: centralized Express error handler with sensible HTTP codes

Key paths
- `src/app.ts` – HTTP app and routes
- `src/server.ts` – HTTP server + Socket.IO wiring
- `src/database/prisma.ts` – Prisma client singleton
- `prisma/schema.prisma` – SQL schema source of truth (PostgreSQL)
- `prisma/migrations/` – generated SQL migrations
- `openapi.yaml` – OpenAPI outline; `OMS API.postman_collection.json` – Postman

## Setup (Windows PowerShell-friendly)

Prerequisites
- Node.js 18+; PostgreSQL 13+

1) Configure environment
- Copy `.env.example` to `.env` and set:
	- `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public`
	- `JWT_SECRET=your-strong-secret`
	- Optional: `PORT=3000`

2) Install dependencies
```powershell
npm install
```

3) Generate Prisma client and run migrations
```powershell
npm run prisma:generate
npm run prisma:migrate:dev
```

4) Seed base units (KG/GM, LT/ML and conversions)
```powershell
npm run seed
```

5) Run
```powershell
# Dev (TS directly)
npm run dev

# Or build + start
npm run build; npm start
```

Server starts on `http://localhost:${PORT:-3000}`.

## API surface (summary)

Auth
- POST `/api/auth/register` – username, email, password, role (`BUYER|SUPPLIER|ADMIN`)
- POST `/api/auth/login` – returns JWT

Units
- GET `/api/units` – list UOMs and conversions

Products (Supplier/Admin)
- GET `/api/products` – public browse; supports `q`, `supplierId`, paging
- POST `/api/products` – upsert (name, pricePerUnit, baseUomId, initialStock)
- PATCH `/api/products/:id/stock` – absolute/delta updates; optional `uomId`

Orders
- POST `/api/orders` (Buyer) – place multi-item order; dynamic UOM per item
- GET `/api/orders` (role-aware)
	- Buyer: own orders
	- Supplier: orders containing their items
	- Admin: `?supplier_id=...` required
- PATCH `/api/orders/:id/status` (Admin) – `APPROVED|SHIPPED|DELIVERED|CANCELLED`
- GET `/api/orders/admin/analytics` (Admin) – counts by status, revenue by supplier

Realtime
- Socket.IO event: `order-status-updated` payload `{ orderId, oldStatus, newStatus }`

## Database/Migrations

- ORM: Prisma
- Provider: PostgreSQL (`datasource db { provider = "postgresql" }`)
- Schema file: `prisma/schema.prisma`
- Migrations: `prisma/migrations/*/migration.sql`

Useful commands
```powershell
# Generate client
npm run prisma:generate

# Create a new migration (optional)
npx prisma migrate dev --name init

# Push schema without migration (dev only)
npx prisma db push
```

## API Docs & Collections

- OpenAPI: `openapi.yaml`
- Postman: `OMS API.postman_collection.json`

## Packaging / Submission

- Public GitHub: commit all sources (avoid committing `.env`)
- Or create a zip including this README, Prisma schema/migrations, and Postman collection

