import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { ChoreOccurrence, Member } from '@shared/types';

interface Props {
  occurrence: ChoreOccurrence;
  members: Member[];
  onClose: () => void;
  onComplete: (
    choreId: number,
    date: string,
    completedBy: number | null,
    note: string
  ) => void;
  onUncomplete: (completionId: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
}

const RECUR_LABEL: Record<string, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: `Every N days`,
};

export default function EventModal({
  occurrence,
  members,
  onClose,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  onHistory,
}: Props) {
  const { chore, member, date, completion } = occurrence;
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completedBy, setCompletedBy] = useState<string>('');
  const [note, setNote] = useState('');

  const recurLabel =
    chore.recurrence_type === 'custom'
      ? `Every ${chore.recurrence_interval} days`
      : RECUR_LABEL[chore.recurrence_type] ?? chore.recurrence_type;

  const handleConfirmComplete = () => {
    onComplete(chore.id, date, completedBy ? Number(completedBy) : null, note);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{chore.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="event-detail-row">
            <span>📅</span>
            <strong>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</strong>
          </div>

          {member && (
            <div className="event-detail-row">
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: member.color,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <strong>{member.name}</strong>
            </div>
          )}

          <div className="event-detail-row">
            <span>🔁</span>
            <span className="chore-recur-badge">{recurLabel}</span>
          </div>

          {chore.description && (
            <div className="event-detail-row" style={{ alignItems: 'flex-start' }}>
              <span>📝</span>
              <span style={{ color: 'var(--color-text)', fontSize: 13 }}>{chore.description}</span>
            </div>
          )}
        </div>

        {/* Completion status */}
        {completion ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="completion-badge">
              ✓ Completed
              {completion.completed_by &&
                members.find((m) => m.id === completion.completed_by) &&
                ` by ${members.find((m) => m.id === completion.completed_by)!.name}`}
            </span>
            {completion.note && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                "{completion.note}"
              </p>
            )}
            <button
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => onUncomplete(completion.id)}
            >
              ↩ Un-mark Complete
            </button>
          </div>
        ) : showCompleteForm ? (
          <div className="complete-form">
            <p className="complete-form-title">Mark as Complete</p>
            <div className="form-group">
              <label className="form-label">Completed by</label>
              <select
                className="form-control"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
              >
                <option value="">— Anonymous —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                className="form-control"
                placeholder="e.g. Used extra cleaner"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success btn-sm" onClick={handleConfirmComplete}>
                ✓ Confirm Complete
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCompleteForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-success"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setShowCompleteForm(true)}
          >
            ✓ Mark Complete
          </button>
        )}

        {/* Actions */}
        <div className="divider" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={onHistory}>
            📋 History
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            ✏️ Edit Chore
          </button>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              if (confirm(`Delete "${chore.title}"? All completions will also be removed.`)) {
                onDelete();
                onClose();
              }
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}
