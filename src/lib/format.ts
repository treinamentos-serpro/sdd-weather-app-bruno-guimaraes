/** Texto único exibido para campos ausentes ou inválidos (FR-02/FR-03). */
export const UNAVAILABLE = 'Indisponível';

const measurementFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

interface MeasurementRange {
  min?: number;
  max?: number;
}

/**
 * Formata uma métrica com unidade fixa. Ausência, valores não finitos ou fora
 * do intervalo viram `UNAVAILABLE`; zero válido é preservado (nunca "-0").
 */
export function formatMeasurement(
  value: number | null | undefined,
  unit: string,
  { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY }: MeasurementRange = {},
): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return UNAVAILABLE;
  }

  const formatted = measurementFormatter.format(value);
  return `${formatted === '-0' ? '0' : formatted} ${unit}`;
}

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
  if (!date) return UNAVAILABLE;
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  return weekdayFormatter.format(date);
}

export function getShortDate(localDate: string): string {
  const date = parseLocalDate(localDate);
  return date ? shortDateFormatter.format(date) : UNAVAILABLE;
}
