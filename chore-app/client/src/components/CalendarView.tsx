import React, { useMemo } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ChoreOccurrence } from '@shared/types';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: ChoreOccurrence;
}

interface Props {
  occurrences: ChoreOccurrence[];
  onSelectEvent: (occurrence: ChoreOccurrence) => void;
  onSelectSlot: (date: string) => void;
  onRangeChange: (from: string, to: string) => void;
}

export default function CalendarView({
  occurrences,
  onSelectEvent,
  onSelectSlot,
  onRangeChange,
}: Props) {
  const events: CalEvent[] = useMemo(
    () =>
      occurrences.map((occ) => {
        // parse the ISO date safely at midnight local time
        const [y, mo, d] = occ.date.split('-').map(Number);
        const day = new Date(y, mo - 1, d);
        return {
          id: `${occ.chore.id}-${occ.date}`,
          title: occ.chore.title,
          start: day,
          end: day,
          allDay: true,
          resource: occ,
        };
      }),
    [occurrences]
  );

  const eventPropGetter = (event: CalEvent) => {
    const occ = event.resource;
    const bg = occ.completion
      ? '#22c55e'
      : (occ.member?.color ?? '#6366f1');
    return {
      style: { backgroundColor: bg, borderColor: bg },
      className: occ.completion ? 'rbc-event-completed' : undefined,
    };
  };

  const handleRangeChange = (
    range: Date[] | { start: Date; end: Date },
    _view?: View
  ) => {
    let from: Date;
    let to: Date;
    if (Array.isArray(range)) {
      from = range[0];
      to = range[range.length - 1];
    } else {
      from = range.start;
      to = range.end;
    }
    onRangeChange(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'));
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    onSelectSlot(format(slot.start, 'yyyy-MM-dd'));
  };

  return (
    <div style={{ height: '100%' }}>
      <Calendar<CalEvent>
        localizer={localizer}
        events={events}
        defaultView="month"
        views={['month', 'week', 'day']}
        selectable
        popup
        onSelectEvent={(e) => onSelectEvent(e.resource)}
        onSelectSlot={handleSelectSlot}
        onRangeChange={handleRangeChange}
        eventPropGetter={eventPropGetter}
        style={{ height: '100%' }}
      />
    </div>
  );
}
