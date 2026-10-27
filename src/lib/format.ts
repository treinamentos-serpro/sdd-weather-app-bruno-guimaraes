const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

function parseLocalDate(localDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return null;

  const date = new Date(`${localDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== localDate) {
    return null;
  }

  return date;
}

export function getDayLabel(localDate: string, index: number): string {
  const date = parseLocalDate(localDate);
  if (!date) return 'Indisponível';
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  return weekdayFormatter.format(date);
}

export function getShortDate(localDate: string): string {
  const date = parseLocalDate(localDate);
  return date ? shortDateFormatter.format(date) : 'Indisponível';
}
