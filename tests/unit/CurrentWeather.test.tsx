import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

afterEach(cleanup);

const { city, current } = mockWeatherData;

function expectMetric(label: string, value: string) {
  expect(screen.getByText(label, { selector: 'dt' }).nextElementSibling).toHaveTextContent(value);
}

describe('CurrentWeather', () => {
  it('identifica a cidade e apresenta condição, temperatura e métricas', () => {
    render(<CurrentWeather city={city} current={current} unit="celsius" />);

    expect(screen.getByRole('region', { name: city.name })).toBeVisible();
    expect(screen.getByRole('heading', { name: city.name })).toBeVisible();
    expect(screen.getByText('São Paulo, Brasil')).toBeVisible();
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(screen.getByText('Parcialmente nublado')).toBeVisible();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expectMetric('Umidade', '65 %');
    expectMetric('Vento', '12,5 km/h');
    expectMetric('Precipitação', '0 mm');
    expectMetric('Pressão', '1.013,2 hPa');
  });

  it('converte somente a temperatura ao mudar a unidade, sem mutar a origem', () => {
    const { rerender } = render(<CurrentWeather city={city} current={current} unit="celsius" />);

    rerender(<CurrentWeather city={city} current={current} unit="fahrenheit" />);
    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();
    expectMetric('Vento', '12,5 km/h');
    expectMetric('Pressão', '1.013,2 hPa');

    rerender(<CurrentWeather city={city} current={current} unit="celsius" />);
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(current.temperatureCelsius).toBe(24.5);
  });

  it('comunica campos ausentes, sem inventar condição ou localização', () => {
    const empty: CurrentWeatherData = {
      temperatureCelsius: null,
      weatherCode: null,
      descriptionPtBr: null,
      sourceLocalTime: null,
    };
    render(
      <CurrentWeather
        city={{ ...city, region: null, country: null }}
        current={empty}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByLabelText('Temperatura: Indisponível')).toBeVisible();
    expect(screen.getAllByText('Indisponível')).toHaveLength(6);
    expect(screen.queryByText('São Paulo, Brasil')).not.toBeInTheDocument();
    expect(screen.queryByText('°F')).not.toBeInTheDocument();
  });

  it('usa o mapeamento WMO quando não há descrição e respeita a descrição recebida', () => {
    const { rerender } = render(
      <CurrentWeather
        city={city}
        current={{ ...current, weatherCode: 61, descriptionPtBr: null }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Chuva leve')).toBeVisible();
    expect(screen.getByText('🌧️')).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <CurrentWeather
        city={city}
        current={{ ...current, descriptionPtBr: 'Condição informada pela fonte' }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Condição informada pela fonte')).toBeVisible();
  });

  it('não infere condições para códigos desconhecidos', () => {
    render(
      <CurrentWeather
        city={city}
        current={{ ...current, weatherCode: 999, descriptionPtBr: null }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Indisponível')).toBeVisible();
    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    { humidityPercent: -1, windSpeedKmh: -1, precipitationMm: -1, pressureHpa: 0 },
    { humidityPercent: 101, windSpeedKmh: NaN, precipitationMm: Infinity, pressureHpa: -1 },
    { humidityPercent: null, windSpeedKmh: null, precipitationMm: null, pressureHpa: null },
  ])('identifica métricas inválidas ou nulas: %o', (metrics) => {
    render(<CurrentWeather city={city} current={{ ...current, ...metrics }} unit="celsius" />);
    for (const label of ['Umidade', 'Vento', 'Precipitação', 'Pressão']) {
      expectMetric(label, 'Indisponível');
    }
  });

  it('preserva zero válido nas métricas e aceita o limite superior de umidade', () => {
    const metrics = { humidityPercent: 0, windSpeedKmh: 0, precipitationMm: 0 };
    const { rerender } = render(
      <CurrentWeather city={city} current={{ ...current, ...metrics }} unit="celsius" />,
    );
    expectMetric('Umidade', '0 %');
    expectMetric('Vento', '0 km/h');
    expectMetric('Precipitação', '0 mm');

    rerender(
      <CurrentWeather city={city} current={{ ...current, humidityPercent: 100 }} unit="celsius" />,
    );
    expectMetric('Umidade', '100 %');
  });

  it('não exibe NaN, undefined, null nem zero negativo para valores corrompidos', () => {
    const corrupted = {
      temperatureCelsius: Number.NaN,
      weatherCode: undefined,
      descriptionPtBr: '   ',
      sourceLocalTime: null,
      humidityPercent: Number.POSITIVE_INFINITY,
      windSpeedKmh: -0,
      precipitationMm: -0,
      pressureHpa: undefined,
    } as unknown as CurrentWeatherData;
    const { container } = render(
      <CurrentWeather
        city={{ ...city, region: null, country: null }}
        current={corrupted}
        unit="celsius"
      />,
    );

    expect(container).not.toHaveTextContent(/NaN|undefined|null|-0\b|Infinity/);
    expect(screen.getByLabelText('Temperatura: Indisponível')).toBeVisible();
    expectMetric('Umidade', 'Indisponível');
    expectMetric('Vento', '0 km/h');
    expectMetric('Precipitação', '0 mm');
    expectMetric('Pressão', 'Indisponível');
  });
});
