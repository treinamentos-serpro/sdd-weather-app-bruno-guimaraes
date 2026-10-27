import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import type { ForecastDay } from '../../src/types/weather';

afterEach(cleanup);

const day: ForecastDay = {
  localDate: '2026-10-29',
  minimumCelsius: -2.5,
  maximumCelsius: 20,
  weatherCode: 61,
  descriptionPtBr: null,
  precipitationProbabilityPercent: 85,
};

function expectMetric(label: string, value: string) {
  expect(screen.getByText(label, { selector: 'dt' }).nextElementSibling).toHaveTextContent(value);
}

describe('ForecastCard', () => {
  it('apresenta data local, condição acessível, temperaturas e probabilidade', () => {
    render(<ForecastCard day={day} index={2} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'quinta-feira' })).toBeVisible();
    expect(screen.getByText('29/10')).toHaveAttribute('dateTime', day.localDate);
    expect(screen.getByText('Chuva leve')).toBeVisible();
    expect(screen.getByText('🌧️')).toHaveAttribute('aria-hidden', 'true');
    expectMetric('Máxima', '20 °C');
    expectMetric('Mínima', '-3 °C');
    expectMetric('Probabilidade de chuva', '85 %');
  });

  it('converte máxima e mínima sem mutar a origem ou a probabilidade', () => {
    const { rerender } = render(<ForecastCard day={day} index={2} unit="celsius" />);
    rerender(<ForecastCard day={day} index={2} unit="fahrenheit" />);

    expectMetric('Máxima', '68 °F');
    expectMetric('Mínima', '28 °F');
    expectMetric('Probabilidade de chuva', '85 %');
    expect(screen.getByRole('heading', { name: 'quinta-feira' })).toBeVisible();

    rerender(<ForecastCard day={day} index={2} unit="celsius" />);
    expectMetric('Máxima', '20 °C');
    expectMetric('Mínima', '-3 °C');
    expect(day.minimumCelsius).toBe(-2.5);
    expect(day.maximumCelsius).toBe(20);
  });

  it.each([
    undefined,
    null,
    -1,
    101,
    NaN,
    Infinity,
  ])('identifica a probabilidade %s como indisponível, sem inventar zero', (probability) => {
    render(
      <ForecastCard
        day={{ ...day, precipitationProbabilityPercent: probability }}
        index={2}
        unit="celsius"
      />,
    );
    expectMetric('Probabilidade de chuva', 'Indisponível');
  });

  it.each([
    [0, '0 %'],
    [100, '100 %'],
    [12.5, '12,5 %'],
  ])('preserva a probabilidade válida %s', (probability, expected) => {
    render(
      <ForecastCard
        day={{ ...day, precipitationProbabilityPercent: probability }}
        index={2}
        unit="celsius"
      />,
    );
    expectMetric('Probabilidade de chuva', expected);
  });

  it('identifica temperaturas e condição ausentes ou inválidas', () => {
    render(
      <ForecastCard
        day={{
          ...day,
          minimumCelsius: null,
          maximumCelsius: NaN,
          weatherCode: 999,
          descriptionPtBr: ' ',
        }}
        index={2}
        unit="fahrenheit"
      />,
    );
    expectMetric('Máxima', 'Indisponível');
    expectMetric('Mínima', 'Indisponível');
    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });

  it('respeita a descrição recebida e comunica data inválida', () => {
    render(
      <ForecastCard
        day={{ ...day, localDate: '2026-02-30', descriptionPtBr: 'Chuva localizada' }}
        index={0}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Chuva localizada')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Indisponível' })).toBeVisible();
    expect(screen.getByText('Data indisponível')).toBeVisible();
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });
});
