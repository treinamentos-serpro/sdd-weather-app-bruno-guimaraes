import type { Unit } from '../types/weather';

export function convertTemperature(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === 'celsius' ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}

export function formatTemperature(celsius: number | null, unit: Unit): string {
  if (celsius === null || !Number.isFinite(celsius)) return 'Indisponível';

  const converted = convertTemperature(celsius, 'celsius', unit);
  if (!Number.isFinite(converted)) return 'Indisponível';

  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return `${Object.is(rounded, -0) ? 0 : rounded} ${unit === 'celsius' ? '°C' : '°F'}`;
}
