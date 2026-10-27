import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature } from '../../src/lib/temperature';

describe('temperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F e vice-versa', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'celsius', 'fahrenheit')).toBe(fahrenheit);
    expect(convertTemperature(fahrenheit, 'fahrenheit', 'celsius')).toBe(celsius);
  });

  it.each([
    [1.5, '2 °C'],
    [-1.5, '-2 °C'],
    [0, '0 °C'],
    [-0.1, '0 °C'],
    [24.49, '24 °C'],
  ])('arredonda %s apenas na apresentação: %s', (value, expected) => {
    expect(formatTemperature(value, 'celsius')).toBe(expected);
    expect(convertTemperature(value, 'celsius', 'celsius')).toBe(value);
  });

  it('arredonda após converter para a unidade escolhida', () => {
    expect(formatTemperature(-17.5, 'fahrenheit')).toBe('1 °F');
    expect(formatTemperature(-22.5, 'fahrenheit')).toBe('-9 °F');
  });

  it.each([null, NaN, Infinity, -Infinity])('comunica temperatura inválida: %s', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(value, 'fahrenheit')).toBe('Indisponível');
  });
});
