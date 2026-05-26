# 🧹 Office Chore App

A lightweight intranet web app for managing recurring office chores with an Outlook-style calendar view.

## Features

- **📅 Calendar view** — Month, Week & Day views (react-big-calendar)
- **🔁 Recurring chores** — Daily, weekly (pick days), monthly, or custom N-day interval
- **👤 Team members** — Add/remove members with colour coding
- **✅ Completion tracking** — Mark chores done with who & optional note; full history log
- **📋 History drawer** — Per-chore completion history with un-complete button

## Quick start

### Prerequisites
- Node.js ≥ 22 (Node 24 recommended — uses built-in `node:sqlite`)
- npm ≥ 9

### Install & run

```bash
cd chore-app

# Install all dependencies (root + server + client)
npm run install:all

# Start both server (port 3001) and client (port 5173) together
npm run dev
```

Open **http://localhost:5173** in your browser.

## Project structure

```
chore-app/
├── shared/types.ts         ← shared TypeScript interfaces
├── server/                 ← Express + node:sqlite backend
│   ├── index.ts
│   ├── db.ts               ← SQLite setup (data/chores.db)
│   ├── routes/             ← members · chores · completions
│   └── utils/recurrence.ts ← expands recurring chores into dates
├── client/                 ← React 18 + Vite frontend
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       └── components/
│           ├── CalendarView.tsx   ← react-big-calendar
│           ├── ChoreForm.tsx      ← add / edit modal
│           ├── EventModal.tsx     ← click an event to complete / edit / delete
│           ├── TeamPanel.tsx      ← sidebar for team members
│           └── HistoryDrawer.tsx  ← slide-in completion history
└── data/chores.db          ← SQLite database (auto-created, gitignored)
```

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members` | List team members |
| POST | `/api/members` | Add member `{ name, color }` |
| DELETE | `/api/members/:id` | Remove member |
| GET | `/api/chores` | List chore templates |
| GET | `/api/chores/events?from=&to=` | Expanded calendar events |
| POST | `/api/chores` | Create chore |
| PUT | `/api/chores/:id` | Update chore |
| DELETE | `/api/chores/:id` | Delete chore |
| GET | `/api/completions?choreId=` | Completion history |
| POST | `/api/completions` | Mark occurrence complete |
| DELETE | `/api/completions/:id` | Un-mark complete |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Calendar | react-big-calendar |
| Date math | date-fns v3 |
| Backend | Node.js, Express, TypeScript, tsx |
| Database | Node.js built-in `node:sqlite` (no native compilation) |
