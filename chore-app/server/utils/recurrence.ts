import {
  addDays,
  addWeeks,
  addMonths,
  getDay,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
  startOfWeek,
  format,
} from 'date-fns';
import type { Chore } from '../../shared/types';

/**
 * Returns all occurrence date strings (yyyy-MM-dd) for a chore
 * that fall within [from, to] inclusive.
 */
export function expandOccurrences(chore: Chore, from: string, to: string): string[] {
  const fromDate = parseISO(from);
  const toDate   = parseISO(to);
  const startDate = parseISO(chore.start_date);
  const endDate   = chore.end_date ? parseISO(chore.end_date) : null;

  const occurrences: string[] = [];

  const inRange = (d: Date): boolean => {
    const afterFrom  = isAfter(d, fromDate)  || isEqual(d, fromDate);
    const beforeTo   = isBefore(d, toDate)   || isEqual(d, toDate);
    const afterStart = isAfter(d, startDate) || isEqual(d, startDate);
    const beforeEnd  = endDate ? (isBefore(d, endDate) || isEqual(d, endDate)) : true;
    return afterFrom && beforeTo && afterStart && beforeEnd;
  };

  const push = (d: Date) => {
    if (inRange(d)) occurrences.push(format(d, 'yyyy-MM-dd'));
  };

  switch (chore.recurrence_type) {
    case 'none': {
      push(startDate);
      break;
    }

    case 'daily': {
      let cur = startDate < fromDate ? fromDate : startDate;
      while (isBefore(cur, toDate) || isEqual(cur, toDate)) {
        if (endDate && isAfter(cur, endDate)) break;
        push(cur);
        cur = addDays(cur, 1);
      }
      break;
    }

    case 'weekly': {
      const days: number[] = chore.recurrence_days?.length
        ? chore.recurrence_days
        : [getDay(startDate)];

      // Start from the Sunday of the earliest relevant week
      const rangeStart = startDate < fromDate ? fromDate : startDate;
      let weekSun = startOfWeek(rangeStart, { weekStartsOn: 0 });

      while (isBefore(weekSun, toDate) || isEqual(weekSun, toDate)) {
        for (const dow of days) {
          const candidate = addDays(weekSun, dow);
          if (endDate && isAfter(candidate, endDate)) continue;
          push(candidate);
        }
        weekSun = addWeeks(weekSun, 1);
        if (endDate && isAfter(weekSun, endDate)) break;
      }
      break;
    }

    case 'monthly': {
      let cur = startDate;
      while (isBefore(cur, toDate) || isEqual(cur, toDate)) {
        if (endDate && isAfter(cur, endDate)) break;
        push(cur);
        cur = addMonths(cur, 1);
      }
      break;
    }

    case 'custom': {
      const interval = Math.max(1, chore.recurrence_interval ?? 1);
      let cur = startDate;
      while (isBefore(cur, toDate) || isEqual(cur, toDate)) {
        if (endDate && isAfter(cur, endDate)) break;
        push(cur);
        cur = addDays(cur, interval);
      }
      break;
    }
  }

  return occurrences;
}
