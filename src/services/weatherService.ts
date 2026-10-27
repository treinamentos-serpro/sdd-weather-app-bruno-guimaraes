import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    Math.abs(value.latitude) > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    Math.abs(value.longitude) > 180
  ) {
    throw new WeatherServiceError('Resposta de geocoding inválida.');
  }

  return {
    id: typeof value.id === 'number' && Number.isInteger(value.id) ? value.id : null,
    name: value.name,
    country: typeof value.country === 'string' && value.country.trim() ? value.country : null,
    region: typeof value.admin1 === 'string' && value.admin1.trim() ? value.admin1 : null,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const response = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
  );
  if (!response.ok) {
    throw new WeatherServiceError(`Erro ao buscar cidades (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || data.error === true) {
    throw new WeatherServiceError('Resposta de geocoding inválida.');
  }
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) {
    throw new WeatherServiceError('Resposta de geocoding inválida.');
  }

  return data.results.map(toCity);
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toWeatherCode(value: unknown): number | null {
  const code = toFiniteNumber(value);
  return code !== null && Number.isInteger(code) && code >= 0 ? code : null;
}

function toLocalDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : null;
}

function toSourceLocalTime(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, value.length) === value
    ? value
    : null;
}

export async function getWeather(city: City): Promise<WeatherData> {
  const response = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto&forecast_days=5`,
  );
  if (!response.ok) {
    throw new WeatherServiceError(`Erro ao buscar previsão (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || data.error === true || !isRecord(data.current) || !isRecord(data.daily)) {
    throw new WeatherServiceError('Resposta de previsão incompleta ou inválida.');
  }

  const sourceLocalTime = toSourceLocalTime(data.current.time);
  const daily = data.daily;
  const dailyDates: unknown[] = Array.isArray(daily.time) ? daily.time : [];
  const startDate = sourceLocalTime?.slice(0, 10) ?? toLocalDate(dailyDates[0]);
  if (startDate === null) {
    throw new WeatherServiceError('Resposta de previsão sem data local válida.');
  }

  const weatherCode = toWeatherCode(data.current.weather_code);
  const current: CurrentWeather = {
    temperatureCelsius: toFiniteNumber(data.current.temperature_2m),
    weatherCode,
    descriptionPtBr: getWeatherCondition(weatherCode)?.description ?? null,
    sourceLocalTime,
  };
  const date = new Date(`${startDate}T00:00:00Z`);
  const forecast: ForecastDay[] = Array.from({ length: 5 }, () => {
    const localDate = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
    const index = dailyDates.indexOf(localDate);
    const code = toWeatherCode(
      Array.isArray(daily.weather_code) ? daily.weather_code[index] : undefined,
    );
    return {
      localDate,
      minimumCelsius: toFiniteNumber(
        Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[index] : undefined,
      ),
      maximumCelsius: toFiniteNumber(
        Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[index] : undefined,
      ),
      weatherCode: code,
      descriptionPtBr: getWeatherCondition(code)?.description ?? null,
    };
  });

  if (
    current.temperatureCelsius === null &&
    current.weatherCode === null &&
    !forecast.some(
      (day) =>
        day.minimumCelsius !== null || day.maximumCelsius !== null || day.weatherCode !== null,
    )
  ) {
    throw new WeatherServiceError('Resposta de previsão sem dados meteorológicos válidos.');
  }

  return {
    city,
    current,
    forecast,
    timeZone: typeof data.timezone === 'string' && data.timezone.trim() ? data.timezone : null,
    utcOffsetSeconds: toFiniteNumber(data.utc_offset_seconds),
  };
}
