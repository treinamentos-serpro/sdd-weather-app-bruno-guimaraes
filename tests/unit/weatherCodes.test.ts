import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('weatherCodes', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('fornece descrição e ícone para o código WMO %s', (code) => {
    expect(getWeatherCondition(code)).toEqual({
      description: expect.any(String),
      icon: expect.any(String),
    });
    expect(getWeatherCondition(code)?.description.length).toBeGreaterThan(0);
    expect(getWeatherCondition(code)?.icon.length).toBeGreaterThan(0);
  });

  it('mapeia condições distintas em pt-BR', () => {
    expect(getWeatherCondition(0)).toEqual({ description: 'Céu limpo', icon: '☀️' });
    expect(getWeatherCondition(61)).toEqual({ description: 'Chuva leve', icon: '🌧️' });
    expect(getWeatherCondition(95)).toEqual({ description: 'Trovoada', icon: '⛈️' });
  });

  it.each([null, -1, 999, 1.5, NaN, Infinity])('não infere condição para %s', (code) => {
    expect(getWeatherCondition(code)).toBeNull();
  });
});
