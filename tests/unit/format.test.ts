import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('Formatação do calendário local', () => {
  it('rotula hoje e amanhã pelo índice, não pelo relógio do dispositivo', () => {
    expect(getDayLabel('2026-10-27', 0)).toBe('Hoje');
    expect(getDayLabel('2026-10-28', 1)).toBe('Amanhã');
    expect(getDayLabel('2026-10-29', 2)).toBe('quinta-feira');
  });

  it.each([
    ['2026-12-31', 'quinta-feira', '31/12'],
    ['2027-01-01', 'sexta-feira', '01/01'],
    ['2028-02-29', 'terça-feira', '29/02'],
  ])('preserva a data local %s, sem deslocamento de fuso', (date, weekday, shortDate) => {
    expect(getDayLabel(date, 2)).toBe(weekday);
    expect(getShortDate(date)).toBe(shortDate);
  });

  it.each([
    '',
    'inválida',
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-1-01',
  ])('comunica a data inválida %s sem normalizá-la para outro dia', (date) => {
    expect(getDayLabel(date, 0)).toBe('Indisponível');
    expect(getShortDate(date)).toBe('Indisponível');
  });
});
