import type { Unit } from '../types/weather';
import { UNAVAILABLE } from './format';

export function convertTemperature(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === 'celsius' ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function formatTemperature(celsius: number | null | undefined, unit: Unit): string {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return UNAVAILABLE;

  const converted = convertTemperature(celsius, 'celsius', unit);
  if (!Number.isFinite(converted)) return UNAVAILABLE;

  const rounded = Math.sign(converted) * Math.round(Math.abs(converted));
  return `${Object.is(rounded, -0) ? 0 : rounded} ${unitLabel(unit)}`;
}
