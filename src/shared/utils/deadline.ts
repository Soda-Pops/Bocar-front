export type ParsedDeadline = {
  days: number | null;
  hours: number;
  expired: boolean;
};

export function parseBackendDeadline(value: string | undefined | null): ParsedDeadline {
  if (!value || value === 'Vencido') {
    return { days: null, hours: 9999, expired: value === 'Vencido' };
  }

  const daysMatch = value.match(/(-?\d+)\s*d/i);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    return { days, hours: Math.max(days * 24, 0), expired: days < 0 };
  }

  const hoursMatch = value.match(/(\d+)\s*h/i);
  const minutesMatch = value.match(/(\d+)\s*m/i);
  if (hoursMatch || minutesMatch) {
    const hours = Number(hoursMatch?.[1] ?? 0);
    const minutes = Number(minutesMatch?.[1] ?? 0);
    return { days: 0, hours: hours + minutes / 60, expired: false };
  }

  return { days: null, hours: 9999, expired: false };
}

export function formatDateForDisplay(value: string | undefined | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

