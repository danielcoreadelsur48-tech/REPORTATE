// JS day-of-week order: 0=Sun, 1=Mon, ..., 6=Sat
// Display order for UI: Mon→Sun (European convention)
export const WEEK_DAYS = [
  { day: 1, short: 'L', label: 'Lunes' },
  { day: 2, short: 'M', label: 'Martes' },
  { day: 3, short: 'X', label: 'Miércoles' },
  { day: 4, short: 'J', label: 'Jueves' },
  { day: 5, short: 'V', label: 'Viernes' },
  { day: 6, short: 'S', label: 'Sábado' },
  { day: 0, short: 'D', label: 'Domingo' },
] as const;

const ABBREV: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export function formatActiveDays(days: number[]): string {
  if (days.length === 0) return 'Ningún día';
  if (days.length === 7) return 'Todos los días';
  // Mon–Fri shorthand
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join() === '1,2,3,4,5') return 'Lun–Vie';
  if (sorted.join() === '0,6') return 'Sáb–Dom';
  return sorted.map((d) => ABBREV[d]).join(', ');
}

export function isTodayActive(days: number[]): boolean {
  return days.includes(new Date().getDay());
}
