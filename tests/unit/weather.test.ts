import { assert, describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type { City, CurrentWeather, ForecastDay, Unit, WeatherData } from '../../src/types/weather';

describe('Contratos de clima', () => {
  it('define as unidades de exibição e preserva a nulabilidade do plano', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();

    const city: City = {
      id: null,
      name: 'Cidade de exemplo',
      country: null,
      region: null,
      latitude: 0,
      longitude: 0,
    };
    const current: CurrentWeather = {
      temperatureCelsius: null,
      weatherCode: null,
      descriptionPtBr: null,
      sourceLocalTime: null,
    };
    const day: ForecastDay = {
      localDate: '2026-10-27',
      minimumCelsius: null,
      maximumCelsius: null,
      weatherCode: null,
      descriptionPtBr: null,
    };
    const weather: WeatherData = {
      city,
      current,
      forecast: [day],
      timeZone: null,
      utcOffsetSeconds: null,
    };

    expect(weather.current.temperatureCelsius).toBeNull();
    expect(weather.forecast[0].minimumCelsius).toBeNull();
  });
});

describe('Mock de clima', () => {
  it('inclui cidade, condições atuais e fuso coerentes', () => {
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.current).toEqual({
      temperatureCelsius: 24.5,
      weatherCode: 2,
      descriptionPtBr: 'Parcialmente nublado',
      sourceLocalTime: '2026-10-27T15:00',
      humidityPercent: 65,
      windSpeedKmh: 12.5,
      precipitationMm: 0,
      pressureHpa: 1013.2,
    });
    expect(mockWeatherData.timeZone).toBe('America/Sao_Paulo');
    expect(mockWeatherData.utcOffsetSeconds).toBe(-3 * 60 * 60);
  });

  it('contém exatamente cinco datas consecutivas a partir da data local atual', () => {
    expect(mockWeatherData.forecast).toHaveLength(5);
    expect(mockWeatherData.forecast.map((day) => day.localDate)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
    expect(mockWeatherData.forecast[0].localDate).toBe(
      mockWeatherData.current.sourceLocalTime?.slice(0, 10),
    );
  });

  it('fornece temperaturas e condições para renderizar todos os dias', () => {
    for (const day of mockWeatherData.forecast) {
      assert(typeof day.minimumCelsius === 'number');
      assert(typeof day.maximumCelsius === 'number');
      expect(day.minimumCelsius).toBeLessThanOrEqual(day.maximumCelsius);
      expect(typeof day.weatherCode).toBe('number');
      expect(day.descriptionPtBr).toEqual(expect.any(String));
      expect(day.descriptionPtBr).not.toBe('');
    }
  });
});
