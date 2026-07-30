pathfinder-ai cron health check — 2026-07-30T06:02:20Z

Scope: upstream harshdwivediiiii/pathfinder-ai | fork tmdeveloper007/pathfinder-ai
Token: <REDACTED> (ghp_Bv2S... — vault token, VALID)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase 1 — PR triage: PRs #1417–#1421
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PR #1417 | MERGED | fix : corrected broken import path in tests/ats.test.mjs
  - sha: af1e01f0 | merged: true
  - CI at merge: test=PASS | build (22.x)=PASS | build-and-push-docker-image=PASS
  - Post-merge status: RED — `build (22.x)` now failing on main with pre-existing bug
  - Action: N/A (merged) — root cause fixed in PR #1630

PR #1418 | MERGED | feat : added AbortController support to use-fetch hook
  - sha: 794ba1bf | merged: true
  - CI at merge: test=PASS | build (22.x)=PASS | build-and-push-docker-image=PASS
  - Post-merge status: RED — same pre-existing bug as #1417
  - Action: N/A (merged) — root cause fixed in PR #1630

PR #1419 | MERGED | test : added test coverage for lib/security/sanitize.js
  - sha: c927da5c | merged: true
  - CI at merge: test=PASS | build (22.x)=PASS | build-and-push-docker-image=PASS
  - Post-merge status: RED — same pre-existing bug
  - Action: N/A (merged) — root cause fixed in PR #1630

PR #1420 | MERGED | test : added test coverage for lib/schemas/issue.js
  - sha: ef2656a5 | merged: true
  - CI at merge: test=PASS | build (22.x)=PASS | build-and-push-docker-image=PASS
  - Post-merge status: RED — same pre-existing bug
  - Action: N/A (merged) — root cause fixed in PR #1630

PR #1421 | MERGED | fix : normalized lib/ai/ai-json.js to use getAiResponseText
  - sha: 3e379443 | merged: true
  - CI at merge: test=PASS | build (22.x)=PASS | build-and-push-docker-image=PASS
  - Post-merge status: RED — same pre-existing bug
  - Action: N/A (merged) — root cause fixed in PR #1630

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Root cause identified: pre-existing CI failure on main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

File: tests/imposter-syndrome.test.mjs
Error: TypeError: Cannot read properties of undefined (reading 'allowed')
  at reframeThoughts actions/imposter-syndrome.js:20:14

The `reframeThoughts` server action calls `checkRateLimit` from
`@/lib/security/rate-limit-actions.js`. The test exercises `reframeThoughts`
directly without mocking `checkRateLimit`. The real implementation runs and
calls `db.$queryRaw` — an unmocked Prisma method — returning undefined,
which then throws when `.allowed` is accessed.

Fix: Add checkRateLimit mock to actionMocks + vi.mock the module, matching
the pattern already used in the companion file
tests/imposter-syndrome-action.test.mjs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fix pushed: PR #1630
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PR #1630 | OPEN | fix : mock checkRateLimit in imposter-syndrome.test.mjs
  URL: https://github.com/harshdwivediiiii/pathfinder-ai/pull/1630
  Branch: tmdeveloper007:#1629-fix-imposter-syndrome-test (sha: 5d27692b)
  Issue: #1629 (also created)

  Changes:
    - Added checkRateLimit: vi.fn() to actionMocks
    - Added vi.mock("@/lib/security/rate-limit-actions.js", ...)
    - Added checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date() })

  CI status:
    PASS | test
    PASS | build (22.x)
    PASS | build-and-push-docker-image
    PASS | label (x2)
    FAIL | Vercel (infra auth issue — pre-existing, not code-related)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRs #1417–#1421: All 5 MERGED — were GREEN at time of merge.
                  Current main branch CI is broken by pre-existing bug
                  unrelated to these PRs.
Fix: PR #1630 submitted — all required CI checks now PASS.
Vercel failure is a pre-existing infrastructure authorization issue.
No --force-with-lease cycles needed (PR was pre-existing, fix is new).

Recommendations
- Merge PR #1630 to restore green CI on main
- Address Vercel authorization: re-authenticate Vercel GitHub App on the repo
- No further action needed on PRs #1417–#1421 (already merged cleanly)
