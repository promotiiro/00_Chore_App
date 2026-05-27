import { Router, Request, Response } from 'express';
import db from '../db';
import { expandOccurrences } from '../utils/recurrence';
import type { Chore, Member, Completion, ChoreOccurrence } from '../../shared/types';

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────

function parseChoreRow(row: Record<string, unknown>): Chore {
  const r = row as unknown as Chore & { recurrence_days: string | null };
  return {
    ...r,
    recurrence_days: r.recurrence_days ? JSON.parse(r.recurrence_days) : null,
  };
}

// ── GET /api/chores  – raw templates ─────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM chores ORDER BY created_at DESC')
    .all() as Record<string, unknown>[];
  res.json(rows.map(parseChoreRow));
});

// ── GET /api/chores/events?from=&to=  – calendar occurrences ─────────────────

router.get('/events', (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to are required' }) as unknown as void;
  }

  const rows = db
    .prepare(
      `SELECT * FROM chores
       WHERE start_date <= ?
         AND (end_date IS NULL OR end_date >= ?)`
    )
    .all(to, from) as Record<string, unknown>[];

  const chores = rows.map(parseChoreRow);

  const memberRows = db.prepare('SELECT * FROM members').all() as unknown as Member[];
  const memberMap = new Map(memberRows.map((m) => [m.id, m]));

  const completionRows = db
    .prepare(
      `SELECT * FROM completions
       WHERE occurrence_date >= ? AND occurrence_date <= ?`
    )
    .all(from, to) as unknown as Completion[];
  const completionMap = new Map(
    completionRows.map((c) => [`${c.chore_id}-${c.occurrence_date}`, c])
  );

  const events: ChoreOccurrence[] = [];
  for (const chore of chores) {
    for (const date of expandOccurrences(chore, from, to)) {
      events.push({
        chore,
        member: chore.assigned_to ? (memberMap.get(chore.assigned_to) ?? null) : null,
        date,
        completion: completionMap.get(`${chore.id}-${date}`) ?? null,
      });
    }
  }

  res.json(events);
});

// ── POST /api/chores ──────────────────────────────────────────────────────────

router.post('/', (req: Request, res: Response) => {
  const b = req.body as Partial<Chore>;
  if (!b.title?.trim()) {
    return res.status(400).json({ error: 'title is required' }) as unknown as void;
  }
  if (!b.start_date) {
    return res.status(400).json({ error: 'start_date is required' }) as unknown as void;
  }

  const result = db
    .prepare(
      `INSERT INTO chores
         (title, description, assigned_to, start_date, end_date,
          recurrence_type, recurrence_interval, recurrence_days,
          start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.title.trim(),
      b.description ?? null,
      b.assigned_to ?? null,
      b.start_date,
      b.end_date ?? null,
      b.recurrence_type ?? 'none',
      b.recurrence_interval ?? 1,
      b.recurrence_days ? JSON.stringify(b.recurrence_days) : null,
      b.start_time ?? null,
      b.end_time ?? null
    );

  const row = db
    .prepare('SELECT * FROM chores WHERE id = ?')
    .get(result.lastInsertRowid) as Record<string, unknown>;
  res.status(201).json(parseChoreRow(row));
});

// ── PUT /api/chores/:id ───────────────────────────────────────────────────────

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body as Partial<Chore>;

  if (!b.title?.trim()) {
    return res.status(400).json({ error: 'title is required' }) as unknown as void;
  }
  if (!b.start_date) {
    return res.status(400).json({ error: 'start_date is required' }) as unknown as void;
  }

  db.prepare(
    `UPDATE chores SET
       title = ?, description = ?, assigned_to = ?,
       start_date = ?, end_date = ?,
       recurrence_type = ?, recurrence_interval = ?, recurrence_days = ?,
       start_time = ?, end_time = ?
     WHERE id = ?`
  ).run(
    b.title.trim(),
    b.description ?? null,
    b.assigned_to ?? null,
    b.start_date,
    b.end_date ?? null,
    b.recurrence_type ?? 'none',
    b.recurrence_interval ?? 1,
    b.recurrence_days ? JSON.stringify(b.recurrence_days) : null,
    b.start_time ?? null,
    b.end_time ?? null,
    id
  );

  const row = db.prepare('SELECT * FROM chores WHERE id = ?').get(id) as Record<
    string,
    unknown
  > | undefined;
  if (!row) return res.status(404).json({ error: 'Not found' }) as unknown as void;
  res.json(parseChoreRow(row));
});

// ── DELETE /api/chores/:id ────────────────────────────────────────────────────

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM chores WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
