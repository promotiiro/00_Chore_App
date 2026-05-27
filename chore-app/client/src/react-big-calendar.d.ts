/**
 * Minimal ambient type declaration for react-big-calendar v1.x.
 * The package ships no .d.ts files; this shim covers everything used in
 * CalendarView.tsx so `tsc` can type-check the project.
 */
declare module 'react-big-calendar' {
  import type React from 'react';

  export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

  export interface SlotInfo {
    start: Date;
    end: Date;
    slots: Date[];
    action: 'select' | 'click' | 'doubleClick';
    bounds?: {
      left: number; x: number; right: number;
      top: number;  y: number; offsetX: number;
      offsetY: number; bottom: number;
    };
    box?: { clientX: number; clientY: number; x: number; y: number };
  }

  export interface CalendarProps<TEvent extends object = object> {
    localizer: object;
    events?: TEvent[];
    defaultView?: View;
    views?: View[];
    selectable?: boolean;
    popup?: boolean;
    style?: React.CSSProperties;
    onSelectEvent?: (event: TEvent) => void;
    onSelectSlot?: (slotInfo: SlotInfo) => void;
    onRangeChange?: (
      range: Date[] | { start: Date; end: Date },
      view?: View
    ) => void;
    eventPropGetter?: (
      event: TEvent,
      start: Date,
      end: Date,
      isSelected: boolean
    ) => { className?: string; style?: React.CSSProperties };
  }

  export function Calendar<TEvent extends object = object>(
    props: CalendarProps<TEvent>
  ): React.ReactElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function dateFnsLocalizer(args: Record<string, any>): object;
}
