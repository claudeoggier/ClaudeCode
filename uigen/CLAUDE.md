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
             FileSystemContext.handleToolCall() mirrors mutations to React state
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
| `src/lib/tools/str-replace.ts` | `str_replace_editor` tool — Claude's main way to create/modify files (view / create / str_replace / insert / undo_edit). |
| `src/lib/tools/file-manager.ts` | `file_manager` tool — rename/delete files and directories. |
| `src/lib/transform/jsx-transformer.ts` | Babel standalone compilation; builds blob-URL HTML with Tailwind + esm.sh CDN import map for iframe. |
| `src/lib/prompts/generation.tsx` | System prompt that instructs Claude to generate components. Entry point must be `/App.jsx`; use Tailwind for styling; use `@/` import alias. |
| `src/lib/auth.ts` | JWT sessions via `jose`; passwords hashed with bcrypt. |
| `src/lib/anon-work-tracker.ts` | Tracks anonymous (unauthenticated) work sessions. |
| `src/app/api/chat/route.ts` | Streaming chat endpoint: receives user messages + file state, runs Claude, executes tools, persists project. `maxSteps: 40`. |
| `src/actions/` | Server actions for project CRUD (create-project, get-project, get-projects). |
| `src/middleware.ts` | Protects `/api/projects/*` and `/api/filesystem/*`; returns 401 without a valid session. |
| `prisma/schema.prisma` | SQLite schema: `User` (email, password) and `Project` (name, messages JSON, data JSON, userId). Always reference this file to understand the structure of data stored in the database. |

### Non-obvious design details

**Dual-path tool call state sync** — The same VFS mutations happen in two places:
1. *Server-side* (`route.ts`): `str_replace_editor` / `file_manager` tools mutate a `VirtualFileSystem` instance during the `streamText()` run, and the final state is persisted to SQLite via `onFinish`.
2. *Client-side* (`FileSystemContext.handleToolCall()`): the Vercel AI SDK delivers tool-call results to the browser, where `handleToolCall()` replays the same create/update/delete/rename operations on the React state. This keeps the UI in sync without a round-trip after the stream ends.

**Preview iframe pipeline** (`jsx-transformer.ts`):
- Each VFS file is Babel-transformed independently to plain JS.
- A blob URL is created per file.
- `createImportMap()` builds a JSON import map that rewrites `@/foo` → the blob URL for `src/foo`, npm packages → `https://esm.sh/<package>`, and creates placeholder stub modules for missing imports so the iframe doesn't crash.
- CSS imports are extracted and injected separately; they do not go through the import map.
- The final HTML includes a Tailwind CDN `<script>`, the import map, and an error boundary that catches runtime errors and displays them inside the preview.

**Project persistence** — Anonymous mode is fully supported. Authentication is optional; `anon-work-tracker.ts` tracks what anonymous users have built. When a project is saved, the entire `messages` array and `fileSystem.serialize()` output are stored as JSON strings in SQLite. On load, `deserializeFromNodes()` in `FileSystemContext` reconstructs the VFS.

**System prompt caching** — `route.ts` attaches `cacheControl: 'ephemeral'` to the system prompt message block (Anthropic prompt-caching feature) to reduce token costs on long sessions.

**Auto-selection** — `FileSystemContext` auto-selects `/App.jsx` as the active file if it exists; otherwise it selects the first root-level file. New files are auto-selected on creation.

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
