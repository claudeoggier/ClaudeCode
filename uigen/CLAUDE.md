# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface; Claude generates the code via tool calls; a Babel-compiled iframe renders the result instantly. Projects are persisted per user in SQLite.

## Commands

```bash
npm run setup        # First-time: install deps + generate Prisma client + run migrations
npm run dev          # Dev server with Turbopack at http://localhost:3000
npm run dev:daemon   # Dev server in background (logs to logs.txt)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run db:reset     # Reset SQLite database (destructive)
```

> Do **not** run `npm audit fix` — dependencies are pinned for compatibility.

## Environment

Create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Without the key the app uses a `MockLanguageModel` that returns canned component examples (Counter, Form, Card). The app is fully usable without a key for dev work that doesn't require real generation.

## Architecture

### Data flow

```
User prompt → /api/chat → Claude (with VirtualFileSystem snapshot)
                              ↓
                    tool calls: str_replace_editor / file_manager
                              ↓
             FileSystemContext updates React state
                              ↓
         CodeEditor + FileTree reflect new files
                              ↓
         jsx-transformer (Babel) compiles JSX in-memory
                              ↓
         iframe loads blob-URL bundle with esm.sh import map
                              ↓
         (if authenticated) project data serialized to SQLite
```

### Key abstractions

| Module | Purpose |
|--------|---------|
| `src/lib/file-system.ts` | `VirtualFileSystem` — in-memory only, never touches disk. Serialized as JSON sent to Claude for context. |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VFS; intercepts AI tool calls and applies them to state. |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat()`; owns messages and submission. |
| `src/lib/provider.ts` | `LanguageModel` implementation using `@ai-sdk/anthropic`; falls back to `MockLanguageModel`. |
| `src/lib/tools/str-replace.ts` | `str_replace_editor` tool — Claude's main way to create/modify files (view / create / str_replace / insert). |
| `src/lib/tools/file-manager.ts` | `file_manager` tool — rename/delete files and directories. |
| `src/lib/transform/jsx-transformer.ts` | Babel standalone compilation; builds blob-URL HTML with Tailwind + esm.sh CDN import map for iframe. |
| `src/lib/prompts/generation.tsx` | System prompt that instructs Claude to generate components. Entry point must be `/App.jsx`; use Tailwind for styling; use `@/` import alias. |
| `src/lib/auth.ts` | JWT sessions via `jose`; passwords hashed with bcrypt. |
| `src/app/api/chat/route.ts` | Streaming chat endpoint: receives user messages + file state, runs Claude, executes tools, persists project. |
| `src/middleware.ts` | Protects routes, validates JWT sessions. |
| `prisma/schema.prisma` | SQLite schema: `User` (email, password) and `Project` (name, messages JSON, data JSON, userId). |

### Component layout

The main UI (`src/app/main-content.tsx`) uses three resizable panels:
- **Left** — `ChatInterface` (chat)
- **Right top** — `PreviewFrame` (iframe sandbox)
- **Right bottom** — `FileTree` + `CodeEditor` (Monaco)

Auth is handled via `AuthDialog` triggered from `HeaderActions`.

### Path alias

`@/*` maps to `./src/*` (defined in `tsconfig.json`). Use this in all new imports.

## Testing

Tests live in `__tests__` directories co-located with the code they test. Run all tests with `npm run test` or a single file with:

```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

Vitest uses a jsdom environment (see `vitest.config.mts`).
