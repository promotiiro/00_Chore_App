import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Chore, Member, RecurrenceType } from '@shared/types';

interface Props {
  chore?: Chore;              // present → edit mode
  initialDate?: string;       // pre-fill start date when creating from calendar click
  members: Member[];
  onSave: (data: Omit<Chore, 'id' | 'created_at'>) => void;
  onClose: () => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface FormState {
  title: string;
  description: string;
  assigned_to: string;
  start_date: string;
  end_date: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days: number[];
}

function buildDefault(chore?: Chore, initialDate?: string): FormState {
  if (chore) {
    return {
      title: chore.title,
      description: chore.description ?? '',
      assigned_to: chore.assigned_to?.toString() ?? '',
      start_date: chore.start_date,
      end_date: chore.end_date ?? '',
      recurrence_type: chore.recurrence_type,
      recurrence_interval: chore.recurrence_interval ?? 7,
      recurrence_days: chore.recurrence_days ?? [],
    };
  }
  return {
    title: '',
    description: '',
    assigned_to: '',
    start_date: initialDate ?? format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    recurrence_type: 'none',
    recurrence_interval: 7,
    recurrence_days: [1, 2, 3, 4, 5], // Mon–Fri default for weekly
  };
}

export default function ChoreForm({ chore, initialDate, members, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => buildDefault(chore, initialDate));

  useEffect(() => {
    setForm(buildDefault(chore, initialDate));
  }, [chore, initialDate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (dow: number) => {
    set(
      'recurrence_days',
      form.recurrence_days.includes(dow)
        ? form.recurrence_days.filter((d) => d !== dow)
        : [...form.recurrence_days, dow].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return;
    if (form.recurrence_type === 'weekly' && form.recurrence_days.length === 0) {
      alert('Please select at least one day for weekly recurrence.');
      return;
    }
    onSave({
      title: form.title.trim(),
      description: form.description || null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      recurrence_type: form.recurrence_type,
      recurrence_interval: form.recurrence_interval,
      recurrence_days:
        form.recurrence_type === 'weekly' ? form.recurrence_days : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2 className="modal-title">{chore ? 'Edit Chore' : 'Add Chore'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-control"
            placeholder="e.g. Clean the coffee machine"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            placeholder="Optional notes or instructions…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
          />
        </div>

        {/* Assigned to */}
        <div className="form-group">
          <label className="form-label">Assigned To</label>
          <select
            className="form-control"
            value={form.assigned_to}
            onChange={(e) => set('assigned_to', e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              className="form-control"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={form.end_date}
              min={form.start_date}
              onChange={(e) => set('end_date', e.target.value)}
            />
          </div>
        </div>

        {/* Recurrence */}
        <div className="form-group">
          <label className="form-label">Recurrence</label>
          <select
            className="form-control"
            value={form.recurrence_type}
            onChange={(e) => set('recurrence_type', e.target.value as RecurrenceType)}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly (choose days)</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom interval</option>
          </select>
        </div>

        {form.recurrence_type === 'weekly' && (
          <div className="form-group">
            <label className="form-label">Repeat on</label>
            <div className="recurrence-days">
              {DAY_LABELS.map((label, dow) => (
                <button
                  key={dow}
                  type="button"
                  className={`day-chip${form.recurrence_days.includes(dow) ? ' active' : ''}`}
                  onClick={() => toggleDay(dow)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.recurrence_type === 'custom' && (
          <div className="form-group">
            <label className="form-label">Repeat every</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="form-control"
                min={1}
                max={365}
                value={form.recurrence_interval}
                onChange={(e) => set('recurrence_interval', Number(e.target.value))}
                style={{ width: 80 }}
              />
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>days</span>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {chore ? 'Save Changes' : 'Add Chore'}
          </button>
        </div>
      </form>
    </div>
  );
}
