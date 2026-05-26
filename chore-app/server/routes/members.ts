import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY name').all();
  res.json(rows);
});

router.post('/', (req: Request, res: Response) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' }) as unknown as void;
  }
  const result = db
    .prepare('INSERT INTO members (name, color) VALUES (?, ?)')
    .run(name.trim(), color || '#6366f1');
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(member);
});

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
