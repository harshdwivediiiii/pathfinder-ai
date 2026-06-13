# Server/Client Module Boundary Guidelines

To prevent accidental client bundling of server-side dependencies (like Prisma, Gemini, Redis, Clerk server SDKs) which can lead to runtime crashes or bundle bloat, this repository enforces strict boundaries between server and client modules.

## Architecture Boundaries

The boundary is guarded by two layers of defense:

1. **Next.js Build-Time Guards**:
   - `server-only`: Modules that access DBs, secrets, or perform server-only operations MUST import `server-only` at the top of the file:
     ```javascript
     import "server-only";
     ```
   - `client-only`: Modules that access browser APIs (`window`, `localStorage`, etc.) MUST import `client-only` at the top:
     ```javascript
     import "client-only";
     ```

2. **ESLint Static Import Restrictions**:
   - ESLint is configured in `eslint.config.mjs` with the `no-restricted-imports` rule.
   - It blocks components inside `components/` and hooks inside `hooks/` from importing server-only modules from `lib/` (e.g. `lib/db`, `lib/prisma`, `lib/gemini`, `lib/env`, `lib/cache/**`, `lib/inngest/**`, `lib/rate-limit**`, `lib/checkUser`).
   - If client code needs server-side data, it must fetch it via **Server Actions** (defined in `actions/` with `"use server";`) or **API Routes** (defined in `app/api/`).

---

## Conventions & Rules

### When creating a new module:
- If it uses `process.env` (non-public vars), database access, or external private APIs, place `import "server-only";` at the top of the file.
- If it uses Web Storage, DOM elements, or browser-only features, place `import "client-only";` at the top of the file.

### How to consume server data in a client component:
1. **Server Actions**: Define or export a function in the `actions/` folder, mark the file with `"use server";` at the top, and import that action into your client component.
2. **API Routes**: Create an endpoint under `app/api/.../route.js`, make a request using `fetch` or a client-side library.
