import { describe, expect, it } from 'vitest';
import { getDayLabel, getShortDate } from '../../src/lib/format';

describe('Formatação do calendário local', () => {
  it('rotula hoje e amanhã pelo índice, não pelo relógio do dispositivo', () => {
    expect(getDayLabel('2026-10-27', 0)).toBe('Hoje');
    expect(getDayLabel('2026-10-28', 1)).toBe('Amanhã');
    expect(getDayLabel('2026-10-29', 2)).toBe('quinta-feira');
  });

  it.each([
    ['2026-11-01', 0],
    ['2030-06-15', 0],
    ['2026-11-01', 1],
    ['2030-06-15', 1],
  ])('usa o índice para rotular %s (índice %s) independentemente do dia da semana', (date, index) => {
    expect(getDayLabel(date, index)).toBe(index === 0 ? 'Hoje' : 'Amanhã');
  });

  it.each([
    ['2026-11-01', 2, 'domingo'],
    ['2026-11-02', 3, 'segunda-feira'],
    ['2026-11-03', 4, 'terça-feira'],
    ['2026-11-04', 5, 'quarta-feira'],
    ['2026-11-05', 6, 'quinta-feira'],
    ['2026-11-06', 2, 'sexta-feira'],
    ['2026-11-07', 3, 'sábado'],
  ])('rotula %s (índice %s) com o dia da semana %s', (date, index, weekday) => {
    expect(getDayLabel(date, index)).toBe(weekday);
  });

  it.each([
    ['2026-10-27', '27/10'],
    ['2026-01-05', '05/01'],
    ['2026-09-09', '09/09'],
  ])('formata %s como data curta dd/MM (%s)', (date, shortDate) => {
    expect(getShortDate(date)).toBe(shortDate);
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
