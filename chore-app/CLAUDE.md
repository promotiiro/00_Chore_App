# Office Chore App

Internal intranet web app for managing recurring office chores with an Outlook-style calendar UI.
Team members are tracked with colour coding; chores support five recurrence modes
(none / daily / weekly / monthly / custom); each calendar occurrence can be marked complete
with a note and who completed it, and has a full history drawer with un-complete support.

See `README.md` for the full feature list and HTTP API reference table.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Client | React 18 + TypeScript 5.3 + Vite 5, ESM |
| Calendar | `react-big-calendar` + `date-fns` v3 |
| Server | Express 4 + TypeScript 5.3, run via `tsx watch` (dev) / `tsc` → `node dist/` (prod) |
| Database | Node.js built-in `node:sqlite` (`DatabaseSync`) — **not** `better-sqlite3` or `sqlite3` |
| Shared types | `shared/types.ts` — plain TS interfaces, no Zod/runtime validation |
| Tooling | `concurrently` orchestrates server + client in dev |

**Requires Node ≥ 22; Node 24 recommended** — `node:sqlite` became stable (no flag) in Node 24.

---

## Adding new features or fixing bugs
**IMPORTANT** when you work on a new feature or bug, create a git branch first then work on changes in that branch for the remainder of the session.

## Repository Layout

```
chore-app/
├── package.json              # orchestrator: dev, install:all, build, start
├── shared/types.ts           # single source of truth for all domain models
├── server/
│   ├── index.ts              # Express bootstrap + route mounting  (server/index.ts:13-15)
│   ├── db.ts                 # node:sqlite init + full DDL schema   (server/db.ts:14-44)
│   ├── routes/               # one Router file per resource: members, chores, completions
│   └── utils/recurrence.ts   # expandOccurrences()                  (server/utils/recurrence.ts:19)
├── client/
│   ├── vite.config.ts        # @shared alias + /api proxy to :3001  (client/vite.config.ts:8,13)
│   └── src/
│       ├── App.tsx           # owns all app state (lift-state-up pattern)
│       ├── api.ts            # fetchJson wrapper + 3 service objects
│       └── components/       # flat: CalendarView, ChoreForm, EventModal, HistoryDrawer, TeamPanel
└── data/chores.db            # SQLite WAL file, auto-created on first run, gitignored
```

---

## Essential Commands

All commands run from `chore-app/`:

| Action | Command |
|---|---|
| First-time install | `npm run install:all` |
| Dev (both servers) | `npm run dev` → server `:3001`, client `:5173` |
| Build client | `npm run build` |
| Build server | `npm --prefix server run build` (not wired into root `build`) |
| Run prod server | `npm start` (requires `server/dist/` to exist) |
| Type-check client | `npm --prefix client run build` (`tsc && vite build`) |
| Type-check server | `npm --prefix server run build` (`tsc -p tsconfig.json`) |

**No lint, test, or format scripts exist.** Type-checking happens only as a side effect of the
build scripts above. Proposing them is a real change, not a missing `npm run` alias.

---

## Critical Conventions

Full detail is in [`.claude/docs/architectural_patterns.md`](.claude/docs/architectural_patterns.md).
Key rules to remember before touching any file:

- **Wire format is snake_case end-to-end** — SQLite columns, JSON over the wire, and TS interfaces
  share the same names (`start_date`, `recurrence_type`, `chore_id` …). Never rename at a boundary.
- **`recurrence_days` is JSON-encoded TEXT in SQLite** — `JSON.stringify` on every write;
  deserialised by `parseChoreRow()` on every read (`server/routes/chores.ts:10-16`).
- **Recurrence expansion is request-time**, never materialised. After any mutation the client
  calls `loadEvents()` to get fresh occurrences (`client/src/App.tsx:50-53`).
- **`node:sqlite` API is fully synchronous** — never `await` `db.prepare(...).run/all/get(...)`.
- **No global error middleware** — return errors inline as `res.status(N).json({ error: '...' })`;
  the client's `fetchJson` expects exactly `{ error }` shape (`client/src/api.ts:3-10`).
- **No auth** — the app is intranet-only and trusts every caller unconditionally.

---

## Additional Documentation

- [`.claude/docs/architectural_patterns.md`](.claude/docs/architectural_patterns.md) —
  design decisions and conventions present across multiple files: state management, API service
  layer, route/handler structure, recurrence expansion, validation, error handling, shared types.
- `README.md` — user-facing quick-start guide and full HTTP API reference table.
