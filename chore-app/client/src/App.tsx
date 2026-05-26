import React, { useEffect, useState, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addDays,
} from 'date-fns';
import type { Member, Chore, ChoreOccurrence } from '@shared/types';
import { membersApi, choresApi, completionsApi } from './api';
import TeamPanel from './components/TeamPanel';
import CalendarView from './components/CalendarView';
import ChoreForm from './components/ChoreForm';
import EventModal from './components/EventModal';
import HistoryDrawer from './components/HistoryDrawer';

// ── initial date range: current month ─────────────────────────────────────────
function defaultRange() {
  const now = new Date();
  return {
    from: format(addDays(startOfMonth(now), -7), 'yyyy-MM-dd'),
    to:   format(addDays(endOfMonth(now), 7),  'yyyy-MM-dd'),
  };
}

export default function App() {
  const [members,      setMembers]      = useState<Member[]>([]);
  const [occurrences,  setOccurrences]  = useState<ChoreOccurrence[]>([]);
  const [dateRange,    setDateRange]    = useState(defaultRange);
  const [error,        setError]        = useState<string | null>(null);

  // Modal state
  const [selectedOcc,  setSelectedOcc]  = useState<ChoreOccurrence | null>(null);
  const [choreForm,    setChoreForm]    = useState<{
    open: boolean; chore?: Chore; initialDate?: string;
  }>({ open: false });
  const [historyChore, setHistoryChore] = useState<Chore | null>(null);

  // ── Error helper ─────────────────────────────────────────────────────────────
  const withError = async (fn: () => Promise<void>) => {
    try { await fn(); }
    catch (e) { setError((e as Error).message); }
  };

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const data = await membersApi.list();
    setMembers(data);
  }, []);

  const loadEvents = useCallback(async () => {
    const data = await choresApi.events(dateRange.from, dateRange.to);
    setOccurrences(data);
  }, [dateRange]);

  useEffect(() => { withError(loadMembers); }, [loadMembers]);
  useEffect(() => { withError(loadEvents);  }, [loadEvents]);

  // ── Member handlers ───────────────────────────────────────────────────────────
  const handleAddMember = (name: string, color: string) =>
    withError(async () => {
      await membersApi.add(name, color);
      await loadMembers();
      await loadEvents(); // re-colour events
    });

  const handleRemoveMember = (id: number) =>
    withError(async () => {
      await membersApi.remove(id);
      await loadMembers();
      await loadEvents();
    });

  // ── Chore handlers ────────────────────────────────────────────────────────────
  const handleSaveChore = (data: Omit<Chore, 'id' | 'created_at'>) =>
    withError(async () => {
      if (choreForm.chore) {
        await choresApi.update(choreForm.chore.id, data);
      } else {
        await choresApi.add(data);
      }
      setChoreForm({ open: false });
      await loadEvents();
    });

  const handleDeleteChore = (choreId: number) =>
    withError(async () => {
      await choresApi.remove(choreId);
      setSelectedOcc(null);
      await loadEvents();
    });

  // ── Completion handlers ───────────────────────────────────────────────────────
  const handleComplete = (
    choreId: number,
    date: string,
    completedBy: number | null,
    note: string
  ) =>
    withError(async () => {
      await completionsApi.add({
        chore_id: choreId,
        occurrence_date: date,
        completed_by: completedBy,
        note: note || null,
      });
      await loadEvents();
    });

  const handleUncomplete = (completionId: number) =>
    withError(async () => {
      await completionsApi.remove(completionId);
      await loadEvents();
    });

  // ── Calendar callbacks ────────────────────────────────────────────────────────
  const handleRangeChange = (from: string, to: string) =>
    setDateRange({ from, to });

  const handleSelectSlot = (date: string) =>
    setChoreForm({ open: true, initialDate: date });

  const handleSelectEvent = (occ: ChoreOccurrence) => setSelectedOcc(occ);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span>🧹</span> Office Chores
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setChoreForm({ open: true })}
          >
            + Add Chore
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="app-body">
        <TeamPanel
          members={members}
          onAdd={handleAddMember}
          onRemove={handleRemoveMember}
        />

        <main className="calendar-container">
          <div className="calendar-wrapper">
            <CalendarView
              occurrences={occurrences}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              onRangeChange={handleRangeChange}
            />
          </div>
        </main>
      </div>

      {/* Modals / Drawers */}
      {choreForm.open && (
        <ChoreForm
          chore={choreForm.chore}
          initialDate={choreForm.initialDate}
          members={members}
          onSave={handleSaveChore}
          onClose={() => setChoreForm({ open: false })}
        />
      )}

      {selectedOcc && (
        <EventModal
          occurrence={selectedOcc}
          members={members}
          onClose={() => setSelectedOcc(null)}
          onComplete={handleComplete}
          onUncomplete={handleUncomplete}
          onEdit={() => {
            setChoreForm({ open: true, chore: selectedOcc.chore });
            setSelectedOcc(null);
          }}
          onDelete={() => handleDeleteChore(selectedOcc.chore.id)}
          onHistory={() => {
            setHistoryChore(selectedOcc.chore);
            setSelectedOcc(null);
          }}
        />
      )}

      {historyChore && (
        <HistoryDrawer
          chore={historyChore}
          onClose={() => setHistoryChore(null)}
          onUncomplete={handleUncomplete}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="error-banner">
          ⚠ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}
