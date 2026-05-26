import React, { useState } from 'react';
import type { Member } from '@shared/types';

interface Props {
  members: Member[];
  onAdd: (name: string, color: string) => void;
  onRemove: (id: number) => void;
}

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TeamPanel({ members, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName('');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  };

  return (
    <aside className="team-panel">
      <div className="team-panel-header">Team Members</div>

      <div className="team-members">
        {members.length === 0 && (
          <p style={{ padding: '20px 8px', color: 'var(--color-text-muted)', fontSize: 12 }}>
            No members yet — add one below.
          </p>
        )}
        {members.map((m) => (
          <div className="member-card" key={m.id}>
            <div
              className="member-avatar"
              style={{ background: m.color }}
              title={m.name}
            >
              {initials(m.name)}
            </div>
            <span className="member-name">{m.name}</span>
            <button
              className="member-delete"
              title="Remove member"
              onClick={() => {
                if (confirm(`Remove ${m.name}? Their chores will become unassigned.`)) {
                  onRemove(m.id);
                }
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <form className="team-add-form" onSubmit={handleAdd}>
        <div className="team-add-row">
          <input
            className="form-control"
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="color"
            className="form-control"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Pick colour"
            style={{ width: 42, padding: '2px 3px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid var(--color-text)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          + Add Member
        </button>
      </form>
    </aside>
  );
}
