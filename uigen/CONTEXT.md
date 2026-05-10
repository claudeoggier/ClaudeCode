# UIGen — Session Context

## Where we left off (2026-05-10, session 2)

### What was done
- Used Playwright (via `npx playwright`) to take screenshots of the running app — browser binaries installed in the npx cache
- **Fixed a recurring Turbopack crash**: the `.claude/commands` directory was being read as a file by Tailwind v4's PostCSS content scanner, causing `os error 21`. Fixed by adding `@source not "../../.claude/**";` to `src/app/globals.css` (path is relative to that file's location)
- **Improved the generation prompt** (`src/lib/prompts/generation.tsx`): added a "Visual quality" section with rules for layout centering, typography hierarchy, cohesive color palette, gradient-initials avatars (no external image URLs), proportional buttons, hover/active states, and lucide-react for icons
- Committed and pushed both changes to `main` (`7e1c716`)

### Current state
- Dev server is running in daemon mode (`npm run dev:daemon`, logs → `logs.txt`)
- The generation prompt now produces noticeably more polished components
- Playwright Chromium is cached and ready for future screenshot/automation use

---

## Where we left off (2026-05-10, session 1)

### What was done
- Created `CLAUDE.md` via `/init` and committed it (removed `CLAUDE.md` from `.gitignore` first)
- Committed all 70 uigen source files to GitHub
- Created `.env` with the Anthropic API key (not committed — it's in .gitignore)
- Ran `npm run setup` — installed 648 packages, generated Prisma client, ran 3 SQLite migrations, created `prisma/dev.db`
- Confirmed the dev server starts correctly (Next.js 15 + Turbopack, ready in ~813ms)

### Current state
- All source code is pushed to GitHub on `main` branch
- `.env` is set up locally with the real API key
- Database is initialized at `prisma/dev.db`
- Everything is ready to run

---

## To start working again

1. Open a terminal and start the dev server:
   ```bash
   cd /Users/claudeoggier/Documents/Claude/ClaudeCode/uigen
   npm run dev
   ```
2. Open the app at **http://localhost:3000**
3. Try generating a component — type something like "create a button component" in the chat

---

## Useful commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run test         # Run Vitest unit tests
npm run db:reset     # Reset the SQLite database (destructive)
npm run build        # Production build
npm run lint         # ESLint
```

---

## Course context

- Learning: Claude Code CLI, git/GitHub, Next.js project setup
- Using: Claude Code web interface (claude.ai/code) — switched from Cursor
- API key is in `.env` (never commit this file)
- The app is an AI-powered React component generator with live preview
