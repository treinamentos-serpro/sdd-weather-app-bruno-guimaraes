import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'celsius', 'fahrenheit')).toBe(fahrenheit);
  });

  it.each([
    [32, 0],
    [212, 100],
    [-40, -40],
  ])('converte %s °F para %s °C', (fahrenheit, celsius) => {
    expect(convertTemperature(fahrenheit, 'fahrenheit', 'celsius')).toBe(celsius);
  });

  it.each([
    ['celsius', 21.37],
    ['fahrenheit', 70.47],
  ] as const)('mantém o valor original quando origem e destino são %s', (unit, value) => {
    expect(convertTemperature(value, unit, unit)).toBe(value);
  });

  it('não acumula deriva ao alternar unidades repetidamente', () => {
    let value = 23.7;
    for (let i = 0; i < 10; i++) {
      value = convertTemperature(
        convertTemperature(value, 'celsius', 'fahrenheit'),
        'fahrenheit',
        'celsius',
      );
    }
    expect(value).toBeCloseTo(23.7, 10);
  });
});

describe('formatTemperature', () => {
  it.each([
    [1.5, '2 °C'],
    [-1.5, '-2 °C'],
    [0, '0 °C'],
    [-0.1, '0 °C'],
    [24.49, '24 °C'],
  ])('arredonda %s °C para "%s" (empates longe de zero)', (value, expected) => {
    expect(formatTemperature(value, 'celsius')).toBe(expected);
  });

  it.each([
    [0, '32 °F'],
    [100, '212 °F'],
    [-40, '-40 °F'],
    [-17.5, '1 °F'],
    [-22.5, '-9 °F'],
  ])('converte %s °C e arredonda em Fahrenheit: "%s"', (celsius, expected) => {
    expect(formatTemperature(celsius, 'fahrenheit')).toBe(expected);
  });

  it.each([
    [-0.5, 'celsius', '-1 °C'],
    [0.5, 'celsius', '1 °C'],
    [2.5, 'fahrenheit', '37 °F'],
    [-27.5, 'fahrenheit', '-18 °F'],
  ] as const)('desempata %s °C para longe de zero em %s: "%s"', (celsius, unit, expected) => {
    expect(formatTemperature(celsius, unit)).toBe(expected);
  });

  it.each([
    [-17.8, 'fahrenheit'],
    [-0, 'celsius'],
    [-0.4, 'celsius'],
  ] as const)('nunca exibe "-0" para %s °C em %s', (celsius, unit) => {
    expect(formatTemperature(celsius, unit)).toBe(`0 ${unitLabel(unit)}`);
  });

  it('comunica indisponível quando a conversão excede o intervalo numérico', () => {
    expect(formatTemperature(Number.MAX_VALUE, 'celsius')).not.toBe('Indisponível');
    expect(formatTemperature(Number.MAX_VALUE, 'fahrenheit')).toBe('Indisponível');
  });

  it('converte os exemplos de referência da spec nas duas direções (AC-04.2)', () => {
    expect(formatTemperature(0, 'fahrenheit')).toBe('32 °F');
    expect(formatTemperature(convertTemperature(32, 'fahrenheit', 'celsius'), 'celsius')).toBe(
      '0 °C',
    );
  });

  it.each([
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('comunica temperatura inválida: %s', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(value, 'fahrenheit')).toBe('Indisponível');
  });
});

describe('unitLabel', () => {
  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o símbolo de %s: %s', (unit, expected) => {
    expect(unitLabel(unit)).toBe(expected);
  });
});
