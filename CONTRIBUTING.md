# Contributing to PathFinder AI 🧠✨

Thank you for your interest in contributing to **PathFinder AI** — an intelligent, AI-powered career platform helping students and professionals build resumes, generate cover letters, and ace interviews using Gemini AI.

This guide covers everything you need to go from zero to your first merged PR. Welcome aboard! 🚀

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Fork & Clone the Repository](#fork--clone-the-repository)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
- [Project Structure](#project-structure)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Making Changes](#making-changes)
  - [Commit Message Style](#commit-message-style)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Getting Assigned an Issue](#getting-assigned-an-issue)
- [Label System](#label-system)
- [Reporting Issues](#reporting-issues)
- [Need Help?](#need-help)

---

## Code of Conduct

By participating in this project, you agree to keep this space respectful, inclusive, and beginner-friendly. Be constructive, patient, and kind — especially with first-time contributors. We're a GSSoC'26 project and welcome contributors of all experience levels. ❤️

---

## License

By contributing to PathFinder AI, you agree that your contributions will be licensed under the **MIT License** that covers this project. See the [`LICENSE`](LICENSE) file at the project root for full details.

---

## Getting Started

### Fork & Clone the Repository

1. **Fork** this repository by clicking the **Fork** button at the top-right of the [PathFinder AI GitHub page](https://github.com/harshdwivediiiii/pathfinder-ai).

2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/pathfinder-ai.git
   cd pathfinder-ai
   ```

3. **Add the upstream remote** to stay in sync with the original:

   ```bash
   git remote add upstream https://github.com/harshdwivediiiii/pathfinder-ai.git
   ```

4. **Verify your remotes:**
   ```bash
   git remote -v
   # origin    https://github.com/YOUR_USERNAME/pathfinder-ai.git (fetch)
   # upstream  https://github.com/harshdwivediiiii/pathfinder-ai.git (fetch)
   ```

---

### Setting Up the Development Environment

#### Prerequisites

| Tool                                  | Purpose             |
| ------------------------------------- | ------------------- |
| [Node.js](https://nodejs.org/) (v18+) | Runtime for Next.js |
| [npm](https://npmjs.com/)             | Package manager     |
| [PostgreSQL](https://postgresql.org/) | Database            |
| Git                                   | Version control     |

#### Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables** — create a `.env.local` file in the root directory:

   ```env
   DATABASE_URL=your_postgresql_connection_string

   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

   GEMINI_API_KEY=your_gemini_api_key
   REDIS_URL=your_redis_connection_string
   RATE_LIMIT_STORE=auto
   ```

   > **Rate limiting note:** Production deployments must use a Redis-backed limiter. Set `REDIS_URL` and keep `RATE_LIMIT_STORE` as `auto` (or set it to `redis`).
   > **💡 No Clerk keys?** The app runs in keyless mode locally — auth routes redirect safely and protected dashboards won't crash. Perfect for rapid frontend development.

3. **Set up Prisma:**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

**Database migrations**

When you change `prisma/schema.prisma`, always create and apply a migration before pushing your branch to avoid schema drift:

```bash
npx prisma migrate dev --name describe-your-change
npx prisma generate
```

This repository's CI also enforces migration parity: the workflow will fail if `prisma/schema.prisma` is changed without a corresponding migration file under `prisma/migrations`. If you see a CI failure mentioning pending migrations, run the commands above, commit the generated migration, and push again.
<<<<<<< HEAD
=======


>>>>>>> upstream/main
4. **Start the dev server:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

5. **Keep your fork up to date** before starting any new work:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

---

## Project Structure

```text
pathfinder-ai/
├── app/              # Next.js App Router pages & layouts
├── components/       # Reusable UI components
├── lib/              # Utility libraries & helpers
├── prisma/           # Database schema & migrations
├── public/           # Static assets
├── styles/           # Global styles
├── utils/            # Helper functions
├── hooks/            # Custom React hooks
├── constants/        # App-wide constants
├── package.json
└── README.md
```

- **UI changes** → `components/` or `app/`
- **AI/backend logic** → `lib/` or `utils/`
- **Database changes** → `prisma/` (always include migration)
- **New pages/routes** → `app/`

---

## Branch Naming Conventions

Always create a new branch for your changes. **Never commit directly to `main`.**

Use this format:

```text
<type>/<short-description>
```

| Type       | When to use                            | Example                           |
| ---------- | -------------------------------------- | --------------------------------- |
| `feat`     | New feature                            | `feat/resume-analytics-dashboard` |
| `fix`      | Bug fix                                | `fix/onboarding-redirect-bug`     |
| `docs`     | Documentation only                     | `docs/improve-env-setup-guide`    |
| `chore`    | Maintenance (deps, config)             | `chore/update-dependencies`       |
| `refactor` | Code restructuring, no behavior change | `refactor/gemini-prompt-helpers`  |
| `test`     | Adding or updating tests               | `test/cover-letter-generation`    |
| `style`    | UI/formatting tweaks                   | `style/mobile-resume-layout`      |

**Create your branch:**

```bash
git checkout -b feat/your-feature-name
```

---

## Making Changes

- Keep each PR **focused** — one feature or fix per PR.
- For **AI features**, optimize prompts, include fallback handling, and test edge cases.
- For **UI changes**, ensure responsiveness across desktop, tablet, and mobile (the app uses a mobile-first approach with TailwindCSS).
- For **database changes**, always include a Prisma migration and update the schema accordingly.
- For **new dependencies**, briefly justify the addition in your PR description.
- For **large features or architectural changes**, open an issue first to align with maintainers before writing code.

### Development Standards

- **Frontend:** Reusable components, Tailwind conventions, accessibility-first
- **Backend:** Input validation, RESTful principles, edge case handling
- **AI Features:** Prompt engineering optimization, fallback handling for API errors

### Commit Message Style

Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```text
<type>(<optional scope>): <short description>
```

**Examples for PathFinder AI:**

```text
feat(resume): add AI-powered bullet point suggestions
fix(onboarding): resolve redirect loop after sign-up
docs: add environment setup steps to CONTRIBUTING.md
chore(deps): update prisma to latest version
refactor(gemini): extract prompt templates into constants
style(dashboard): fix responsive layout on mobile screens
```

**Rules:**

- Use **imperative mood** — "add", not "added" or "adds"
- Keep the subject line under **72 characters**
- Reference related issues at the bottom: `Closes #12` or `Fixes #7`

---

## Submitting a Pull Request

1. **Push your branch** to your fork:

   ```bash
   git push origin feat/your-feature-name
   ```

2. Go to [harshdwivediiiii/pathfinder-ai](https://github.com/harshdwivediiiii/pathfinder-ai) on GitHub and click **"Compare & pull request"**.

3. Fill in the PR description with:
   - A clear **title** following the commit style (e.g. `feat: add resume analytics dashboard`)
   - **What changed** and **why**
   - Screenshots or screen recordings for any UI changes
   - The issue it resolves: `Closes #<issue-number>`

4. **PR checklist before submitting:**
   - [ ] Branch is synced with latest `upstream/main` and conflicts resolved
   - [ ] Code is production-ready and tested locally
   - [ ] UI changes are responsive across screen sizes
   - [ ] Existing code conventions are followed
   - [ ] Documentation updated if needed
   - [ ] Screenshots attached for any UI changes
   - [ ] Commits follow the Conventional Commits style

5. A maintainer will review your PR. Requested changes are normal — address the feedback, push your updates, and you'll be merged once approved. 🎉

> **Note:** PRs introducing breaking changes, new external APIs, or major architecture decisions should be discussed in a GitHub Issue before implementation.

---

## Getting Assigned an Issue

This project is part of **GSSoC'26** — issues must be assigned before you start working on them.

1. Browse [open issues](https://github.com/harshdwivediiiii/pathfinder-ai/issues)
2. Comment on the issue you want to work on with your planned approach
3. Wait for a maintainer to officially assign it to you
4. Only begin coding after assignment

**Example comment:**

```markdown
Hi maintainers 👋

I'd like to work on this issue under GSSoC'26.

Planned approach:

- Improve the validation flow on the resume form
- Optimize Gemini API error handling
- Update related documentation

Could you please assign it to me?
```

> Starting work before assignment may result in your PR not being considered.

---

## Label System

Labels are managed via GitHub Actions automation.

| Category       | Labels                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| **Difficulty** | `level:beginner` · `level:intermediate` · `level:advanced` · `level:critical` |
| **Type**       | `type:bug` · `type:feature` · `type:docs` · `type:design` · `type:security`   |
| **Domain**     | `frontend` · `backend` · `database` · `ai` · `ui/ux`                          |
| **Programs**   | `Gssoc` · `good first issue`                                                  |

New to open source? Filter by **`good first issue`** and **`level:beginner`** for the most approachable starting points.

---

## Reporting Issues

Found a bug or have a feature idea? [Open an issue](https://github.com/harshdwivediiiii/pathfinder-ai/issues)!

**Before opening an issue:**

- Search [existing issues](https://github.com/harshdwivediiiii/pathfinder-ai/issues) to avoid duplicates.
- Check if it's already fixed in the latest commit on `main`.

**For bug reports, include:**

- Clear, descriptive title
- Steps to reproduce the problem
- Expected vs. actual behavior
- Your OS, Node.js version (`node -v`), and browser
- Relevant error logs from the terminal or browser DevTools

**For feature requests, include:**

- The problem you're solving
- Your proposed solution
- Any alternatives you considered

Use appropriate labels when filing (`type:bug`, `type:feature`, `frontend`, `ai`, etc.).

---

## Need Help?

- Browse [open issues](https://github.com/harshdwivediiiii/pathfinder-ai/issues) for context on ongoing work.
- Open a [Discussion](https://github.com/harshdwivediiiii/pathfinder-ai/discussions) for questions that aren't bugs or features.
- Leave a comment on the relevant issue or PR — maintainers are active and happy to help.
- Reach the maintainer directly: 📧 [harshvardhandwivedi18@gmail.com](mailto:harshvardhandwivedi18@gmail.com)

---

## Ways to Contribute

Not sure where to start? Here are some great entry points:

- 📖 Documentation improvements
- 💅 UI polishing & loading skeleton states
- 📱 Mobile responsiveness fixes
- ♿ Accessibility enhancements
- 🧪 Unit test coverage
- 🤖 AI prompt engineering improvements
- ⚡ Performance optimizations

---

_This guide is open to improvement too. If something is unclear or missing — feel free to open a PR or issue for it._

---

<div align="center">

**PathFinder AI** — _Smart Careers Start Here._

</div>
