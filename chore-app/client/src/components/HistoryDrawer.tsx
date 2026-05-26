import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { Chore, CompletionWithMember } from '@shared/types';
import { completionsApi } from '../api';

interface Props {
  chore: Chore;
  onClose: () => void;
  onUncomplete: (completionId: number) => void;
}

export default function HistoryDrawer({ chore, onClose, onUncomplete }: Props) {
  const [history, setHistory] = useState<CompletionWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    completionsApi
      .list(chore.id)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [chore.id]);

  const handleUncomplete = async (id: number) => {
    await onUncomplete(id);
    setHistory((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{chore.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Completion history
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="drawer-body">
          {loading && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading…</p>
          )}
          {!loading && history.length === 0 && (
            <div className="history-empty">
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p>No completions recorded yet.</p>
            </div>
          )}
          {!loading &&
            history.map((item) => (
              <div className="history-item" key={item.id}>
                <div className="history-dot" />
                <div className="history-info">
                  <div className="history-date">
                    {format(parseISO(item.occurrence_date), 'EEE, MMM d, yyyy')}
                  </div>
                  <div className="history-meta">
                    {item.member_name ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.member_color ?? '#888',
                            marginRight: 4,
                          }}
                        />
                        {item.member_name}
                        {' · '}
                      </>
                    ) : null}
                    {format(parseISO(item.completed_at), 'h:mm a')}
                  </div>
                  {item.note && <div className="history-note">"{item.note}"</div>}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Un-mark complete"
                  onClick={() => handleUncomplete(item.id)}
                  style={{ fontSize: 16, color: 'var(--color-text-muted)' }}
                >
                  ↩
                </button>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
