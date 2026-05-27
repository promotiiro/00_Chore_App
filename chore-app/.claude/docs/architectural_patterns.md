# Architectural Patterns

Patterns that appear across **multiple files** in this codebase. Each entry describes where
the pattern lives, and the rule to follow when extending the code.

---

## 1. Lift-state-up + prop-drilling (no global store)

**Where:** `client/src/App.tsx:26-36` (all `useState` declarations), every component file in
`client/src/components/` (receive props + callback props).

`App.tsx` is the single owner of all app-level state: `members`, `occurrences`, `dateRange`,
`error`, `selectedOcc`, `choreForm`, `historyChore`. Children receive plain props and
callback functions — no Context, Redux, Zustand, or Recoil anywhere.

**Exception:** `HistoryDrawer` fetches and owns its own `history` state because it is opened
on-demand for one specific chore and its data is never needed elsewhere.

**Rule when adding:** New app-level state belongs in `App.tsx`. New mutations must be
`withError`-wrapped handlers defined in `App.tsx` that call the API and then re-`loadEvents()`
/ `loadMembers()`. Pass data and handlers down as props.

---

## 2. Service-object API layer with a single `fetchJson` wrapper

**Where:** `client/src/api.ts`

`fetchJson<T>(url, opts)` (`api.ts:3-10`) is the only place that calls `fetch`. It throws a
typed `Error` whose `.message` is the `{ error }` string the server returned (or `res.statusText`
on parse failure).

Three named service objects export method-style functions, one per backend resource:

- `membersApi` — `api.ts:14`: `list`, `add`, `remove`
- `choresApi`  — `api.ts:30`: `list`, `events`, `add`, `update`, `remove`
- `completionsApi` — `api.ts:56`: `list`, `add`, `remove`

All paths are relative (`/api/...`); Vite proxies them to `:3001` in dev (`client/vite.config.ts:13-17`).

**Rule when adding:** A new backend resource gets a new service-object export in `api.ts` using
the same method-name conventions (`list`, `add`, `update`, `remove` + resource-specific verbs).
Never call `fetch` directly from a component.

---

## 3. One Express Router per resource, mounted under `/api/<resource>`

**Where:** `server/index.ts:13-15` (mounting), `server/routes/members.ts`,
`server/routes/chores.ts`, `server/routes/completions.ts` (implementations).

Each file exports a `Router()` and is mounted as `app.use('/api/<resource>', router)`. Handlers
call `db.prepare(...).run/all/get(...)` inline — there is no controller layer, no service layer,
no repository abstraction.

**Rule when adding:** Create `server/routes/<resource>.ts`, export `default Router()`, mount
it in `server/index.ts`. Keep DB access inline in the handler.

---

## 4. Inline validation, `{ error }` JSON shape, no global error middleware

**Where:** `server/routes/chores.ts:77-82`, `server/routes/chores.ts:113-119`,
`server/routes/completions.ts:9-12`, `server/routes/completions.ts:32-36`
(repeated validation pattern across all handlers).

Every handler validates required fields at the top:
`if (!field) return res.status(400).json({ error: '...' }) as unknown as void;`

The `as unknown as void` cast is intentional — it satisfies the Express handler return type
without breaking the early return.

Unique-constraint conflicts from SQLite are caught per-handler and translated to HTTP 409
(`server/routes/completions.ts:48-57`). There is no global `app.use(errorHandler)`.

**Rule when adding:** Validate at the top of the handler, return `{ error: string }` with the
appropriate HTTP status. Translate known SQLite error codes to meaningful HTTP responses in a
local `try/catch`. Re-throw everything else.

---

## 5. Snake_case end-to-end; JSON-encoded TEXT for array columns

**Where:** `server/db.ts:22-44` (DDL), `shared/types.ts:10-21` (TS interfaces),
`server/routes/chores.ts:87-99` (INSERT), `server/routes/chores.ts:122-135` (UPDATE),
`server/routes/chores.ts:10-16` (`parseChoreRow` deserialiser).

SQLite column names, TypeScript interface field names, and HTTP JSON keys are identical —
all snake_case. No camelCase transform exists anywhere in the codebase.

`recurrence_days` is the only array-valued column. It is stored as a JSON string (`"[1,3,5]"`)
in a `TEXT` column. Every write serialises it with `JSON.stringify(b.recurrence_days)`. Every
read passes the raw row through `parseChoreRow()`, which calls `JSON.parse` on that field.

**Rule when adding:** Keep field names snake_case across the DDL → TS interface → HTTP JSON
boundary. For any new array column, follow the same JSON-TEXT + `parseChoreRow`-style helper pattern.

---

## 6. Shared types via `shared/types.ts` — dual import path

**Where:** `shared/types.ts` (definitions), `client/vite.config.ts:8-10` (`@shared` alias),
`client/src/App.tsx:8`, `client/src/api.ts:1` (client imports),
`server/routes/chores.ts:4`, `server/utils/recurrence.ts:13` (server imports).

`shared/types.ts` is the single authoritative file for all domain models (`RecurrenceType`,
`Member`, `Chore`, `Completion`, `CompletionWithMember`, `ChoreOccurrence`).

- **Client** imports as `import type { ... } from '@shared/types'` — resolved by the Vite alias
  in `client/vite.config.ts:8-10` and mirrored in `client/tsconfig.json` `paths`.
- **Server** imports as `import type { ... } from '../../shared/types'` — works because
  `server/tsconfig.json` sets `"rootDir": ".."` and includes `../shared/**/*.ts`.

**Rule when adding:** Every domain model belongs in `shared/types.ts`. Never duplicate an
interface in client-only or server-only code. When adding a model, make sure it is reachable via
both import paths.

---

## 7. Request-time recurrence expansion (no materialised occurrences)

**Where:** `server/utils/recurrence.ts:19` (`expandOccurrences`),
`server/routes/chores.ts:29-71` (`GET /api/chores/events`).

The `chores` table stores **templates** only. The endpoint `GET /api/chores/events?from=&to=`
expands each template into per-date `ChoreOccurrence` objects in memory using
`expandOccurrences(chore, from, to)`, then joins with the `completions` table to mark done
occurrences. Nothing is persisted in a separate occurrences table.

`expandOccurrences` handles all five `RecurrenceType` values using `date-fns` functions;
`weekly` recurrence reads `chore.recurrence_days` (day-of-week numbers, 0 = Sun).

Because occurrences are ephemeral, the client calls `loadEvents()` after every mutation to
get a fresh expansion (`client/src/App.tsx:50-53`, called in every handler).

**Rule when adding a new `RecurrenceType`:**
1. Add the new literal to the union in `shared/types.ts:1`.
2. Add a `case` in `expandOccurrences` (`server/utils/recurrence.ts`).
3. Ensure `ChoreForm.tsx` can produce and submit the new recurrence shape.

---

## 8. `withError(fn)` async mutation wrapper

**Where:** `client/src/App.tsx:39-42` (definition), every handler in `App.tsx` from line 59
onward (usage).

```
const withError = async (fn: () => Promise<void>) => {
  try { await fn(); }
  catch (e) { setError((e as Error).message); }
};
```

Every handler that calls an API method is defined as an arrow function passed to `withError`.
Caught errors surface as `Error.message` into the `error` state, which renders the dismissible
`.error-banner` div (`client/src/App.tsx:201-206`).

**Rule when adding:** Never call an API method from a handler without wrapping in `withError(...)`.

---

## 9. Reload-after-mutate (no optimistic UI, no client-side cache)

**Where:** Every mutation handler in `client/src/App.tsx:59-113`.

After every `add`, `update`, or `remove` operation the handler awaits `loadEvents()` and/or
`loadMembers()` to re-fetch from the server. There is no SWR, React Query, Zustand cache, or
optimistic state update anywhere.

**Rule when adding:** Keep this pattern. Optimistic updates would require tracking the
snake_case wire format in client-side state and add complexity that isn't warranted for an
intranet tool with a single local SQLite database.

---

## Verification Checklist

Use this to confirm a change respects the patterns above:

1. `npm run dev` from `chore-app/` — both servers start (`:3001` and `:5173`).
2. Open `http://localhost:5173`: add a member, add a chore with each recurrence type, mark one
   occurrence complete (with a note), then un-complete it from the history drawer.
3. Server-only change: `npm --prefix server run build` must succeed (type-checks server + shared).
4. Client-only change: `npm --prefix client run build` must succeed (type-checks client + shared).
5. Both changed: run both build commands above.
