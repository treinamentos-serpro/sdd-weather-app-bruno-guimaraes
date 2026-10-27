import type { City } from '../types/weather';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
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

  const response = await fetch(
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
