# Fix: generate API route — missing helper imports

Summary
-------
The `POST /api/generate` route (`app/api/generate/route.js`) previously referenced helper functions that were not imported, which caused an immediate `ReferenceError` on the first request. The functions involved were `getRateLimitIdentifier`, `enforceRateLimit`, `buildRateLimitResponse`, `preparePromptForGeneration`, and `buildSseErrorResponse`.

What I changed
-------------
- Added the missing imports directly in `app/api/generate/route.js` for the helper functions already used by the route.
- Added unit tests covering rate-limiting and SSE helper response behavior:
  - `tests/generate-api.test.mjs`

Files touched
------------
- `app/api/generate/route.js` — fixed missing imports and kept existing route behavior
- `tests/generate-api.test.mjs` — rate-limit + SSE helper unit tests

Reproduction steps (local)
-------------------------
1. Install dependencies and generate Prisma client if you haven't already:

```bash
npm install
npx prisma generate
```

2. Run the test suites that validate the fix (these run quickly without external services):

```bash
node --test --test-only tests/generate-api.test.mjs
```

3. (Manual server verification) Start the dev server and exercise the endpoint. In one terminal:

```bash
npm run dev
```

4. With the dev server running, test common SSE error flows using `curl` (server assumed at `http://localhost:3000`):

- Missing prompt (should stream SSE error with `Prompt is required`):

```bash
curl -N -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

- Career-context guard (should stream SSE error when input is non-career):

```bash
curl -N -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me a joke"}'
```

- Rate-limiting (quick loop to trip limit for unauthenticated IP-based requests):

```bash
for i in {1..10}; do 
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/generate \
    -H "Content-Type: application/json" -d '{"prompt":"career advice"}';
done
```

Notes: In local dev, Clerk may run in keyless mode and `auth()` can return `null`; the handler enforces rate-limits prior to requiring a valid `userId`, so the loop above can demonstrate a `429` response even without a Clerk session. If Clerk is active, authenticate first.

Verification
------------
- All new tests pass locally (`node --test` ran successfully in the development environment used for this fix).
- Manual `curl` steps should produce SSE text containing an `error` JSON object followed by `data: [DONE]`.

PR checklist for this fix
-----------------------
- [ ] Code compiles and tests pass locally
- [ ] Add a short description to the PR referencing this docs file
- [ ] Add `tests/generate-api.test.mjs` to CI if not already included
- [ ] Optionally: add a changelog entry

Follow-ups
----------
- Keep ATS-related fixes (model naming mismatch and suggestions shape) in separate scoped PRs.
