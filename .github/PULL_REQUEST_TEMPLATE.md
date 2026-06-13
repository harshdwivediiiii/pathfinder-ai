## Related Issue

<!--
Link the issue this PR resolves. Every PR should close at least one issue.
  e.g., "Closes #123"
-->

Closes #...

> Why is this a good practice? Linking PRs to issues keeps the project's history
> traceable and helps maintainers understand the context behind changes.

---

## Description of Changes

<!--
Explain what changed and why. Focus on the "why" — what problem does this solve,
and how does the implementation address it?
-->

[Describe your changes here]

---

## Testing Notes

<!--
Describe how you verified your changes work. Examples:
  - "Added unit tests for the new utility function"
  - "Manually tested the flow end-to-end in dev"
  - "Ran `npm run test:unit` and `npm run lint` — all passing"
-->

- [ ] Changes tested locally
- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes (or `npx vitest run`)

---

## PR Checklist

- [ ] Branch is synced with the latest `upstream/main` and all conflicts are resolved
- [ ] Code is production-ready and tested locally
- [ ] UI changes are responsive across screen sizes
- [ ] Existing code conventions are followed
- [ ] Documentation has been updated if needed
- [ ] Screenshots are attached for any UI changes
- [ ] Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) style

---

### 💡 PR Title Reminder

The `pr-labeler.yml` workflow uses **Conventional Commit prefixes** in PR titles
to auto-label pull requests. Please use one of the following prefixes in your
PR title:

| Prefix     | When to use                        |
|------------|------------------------------------|
| `feat:`    | A new feature                      |
| `fix:`     | A bug fix                          |
| `docs:`    | Documentation only                 |
| `chore:`   | Maintenance (deps, config)         |
| `refactor:`| Code restructuring, no behavior change |
| `test:`    | Adding or updating tests           |
| `style:`   | UI/formatting tweaks               |

**Example:** `feat: add resume analytics dashboard`
