import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /api/completions?choreId=X
router.get('/', (req: Request, res: Response) => {
  const { choreId } = req.query as { choreId?: string };
  if (!choreId) {
    return res.status(400).json({ error: 'choreId is required' }) as unknown as void;
  }
  const rows = db
    .prepare(
      `SELECT c.*, m.name AS member_name, m.color AS member_color
       FROM completions c
       LEFT JOIN members m ON c.completed_by = m.id
       WHERE c.chore_id = ?
       ORDER BY c.occurrence_date DESC`
    )
    .all(choreId);
  res.json(rows);
});

// POST /api/completions
router.post('/', (req: Request, res: Response) => {
  const { chore_id, occurrence_date, completed_by, note } = req.body as {
    chore_id?: number;
    occurrence_date?: string;
    completed_by?: number | null;
    note?: string | null;
  };
  if (!chore_id || !occurrence_date) {
    return res
      .status(400)
      .json({ error: 'chore_id and occurrence_date are required' }) as unknown as void;
  }
  try {
    const result = db
      .prepare(
        `INSERT INTO completions (chore_id, occurrence_date, completed_by, note)
         VALUES (?, ?, ?, ?)`
      )
      .run(chore_id, occurrence_date, completed_by ?? null, note ?? null);
    const row = db
      .prepare('SELECT * FROM completions WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (err: unknown) {
    // node:sqlite throws ERR_SQLITE_ERROR; unique violation message contains 'UNIQUE constraint failed'
    const e = err as { code?: string; message?: string };
    if (e.code === 'ERR_SQLITE_ERROR' && e.message?.includes('UNIQUE constraint failed')) {
      return res
        .status(409)
        .json({ error: 'Already marked complete for this date' }) as unknown as void;
    }
    throw err;
  }
});

// DELETE /api/completions/:id  (un-complete)
router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM completions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
