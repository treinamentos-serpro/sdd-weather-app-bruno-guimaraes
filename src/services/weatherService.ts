import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

export const REQUEST_TIMEOUT_MS = 10_000;

export type WeatherErrorKind = 'network' | 'timeout' | 'http' | 'api' | 'invalid-response';

type ServiceOperation = 'search' | 'weather';

interface WeatherServiceErrorOptions {
  kind: WeatherErrorKind;
  status?: number | null;
  /** Detalhe técnico para diagnóstico; nunca deve ser exibido ao usuário. */
  detail?: string | null;
}

/** `message` é sempre amigável (pt-BR) e pode ser exibida diretamente na interface. */
export class WeatherServiceError extends Error {
  readonly kind: WeatherErrorKind;
  readonly status: number | null;
  readonly detail: string | null;

  constructor(message: string, { kind, status = null, detail = null }: WeatherServiceErrorOptions) {
    super(message);
    this.name = 'WeatherServiceError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

const failurePrefix: Record<ServiceOperation, string> = {
  search: 'Não foi possível buscar a cidade.',
  weather: 'Não foi possível carregar a previsão do tempo.',
};

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function friendlyMessage(
  operation: ServiceOperation,
  kind: WeatherErrorKind,
  status: number | null,
): string {
  const prefix = failurePrefix[operation];
  switch (kind) {
    case 'timeout':
      return `${prefix} O serviço de clima não respondeu em ${REQUEST_TIMEOUT_MS / 1000} segundos. Verifique sua conexão e tente novamente.`;
    case 'network':
      return isOffline()
        ? `${prefix} Você está sem conexão com a internet. Reconecte-se e tente novamente.`
        : `${prefix} Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.`;
    case 'http':
      if (status === 429) {
        return `${prefix} Muitas consultas em pouco tempo. Aguarde alguns instantes e tente novamente.`;
      }
      if (status !== null && status >= 500) {
        return `${prefix} O serviço de clima está temporariamente indisponível. Tente novamente em alguns instantes.`;
      }
      return `${prefix} O serviço de clima recusou a consulta. Tente novamente.`;
    case 'api':
      return `${prefix} O serviço de clima não conseguiu processar a consulta. Tente novamente.`;
    case 'invalid-response':
      return `${prefix} Os dados recebidos estão incompletos ou em formato inesperado. Tente novamente.`;
  }
}

function serviceError(
  operation: ServiceOperation,
  kind: WeatherErrorKind,
  detail: string,
  status: number | null = null,
): WeatherServiceError {
  return new WeatherServiceError(friendlyMessage(operation, kind, status), {
    kind,
    status,
    detail,
  });
}

interface JsonResponse {
  response: Response;
  data: unknown;
  invalidJson: boolean;
}

// O timeout cobre a requisição inteira, inclusive a leitura do corpo (AC-05.5).
async function fetchJsonWithTimeout(
  operation: ServiceOperation,
  url: string,
): Promise<JsonResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    try {
      return { response, data: await response.json(), invalidJson: false };
    } catch (error) {
      if (error instanceof SyntaxError) return { response, data: undefined, invalidJson: true };
      throw error;
    }
  } catch (error) {
    if (controller.signal.aborted || (isRecord(error) && error.name === 'AbortError')) {
      throw serviceError(operation, 'timeout', `Timeout após ${REQUEST_TIMEOUT_MS} ms.`);
    }
    const cause = error instanceof Error ? error.message : String(error);
    throw serviceError(operation, 'network', `Falha de rede: ${cause}`);
  } finally {
    clearTimeout(timeout);
  }
}

function apiReason(data: unknown): string {
  return isRecord(data) && typeof data.reason === 'string' && data.reason.trim()
    ? ` ${data.reason.trim()}`
    : '';
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
    throw serviceError('search', 'invalid-response', 'Resultado de geocoding inválido.');
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

  const { response, data, invalidJson } = await fetchJsonWithTimeout(
    'search',
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
  );
  if (!response.ok) {
    throw serviceError(
      'search',
      'http',
      `Geocoding HTTP ${response.status}.${apiReason(data)}`,
      response.status,
    );
  }
  if (invalidJson) {
    throw serviceError('search', 'invalid-response', 'Geocoding com JSON inválido.');
  }
  if (isRecord(data) && data.error === true) {
    throw serviceError('search', 'api', `Erro declarado pelo geocoding.${apiReason(data)}`);
  }
  if (!isRecord(data)) {
    throw serviceError('search', 'invalid-response', 'Resposta de geocoding inválida.');
  }
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) {
    throw serviceError('search', 'invalid-response', 'Resposta de geocoding inválida.');
  }

  return data.results.map(toCity);
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toMetricNumber(
  value: unknown,
  min: number,
  max = Number.POSITIVE_INFINITY,
): number | null {
  const number = toFiniteNumber(value);
  return number !== null && number >= min && number <= max ? number : null;
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
  const { response, data, invalidJson } = await fetchJsonWithTimeout(
    'weather',
    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=5`,
  );
  if (!response.ok) {
    throw serviceError(
      'weather',
      'http',
      `Previsão HTTP ${response.status}.${apiReason(data)}`,
      response.status,
    );
  }
  if (invalidJson) {
    throw serviceError('weather', 'invalid-response', 'Previsão com JSON inválido.');
  }
  if (isRecord(data) && data.error === true) {
    throw serviceError('weather', 'api', `Erro declarado pela previsão.${apiReason(data)}`);
  }

  if (!isRecord(data) || !isRecord(data.current) || !isRecord(data.daily)) {
    throw serviceError('weather', 'invalid-response', 'Previsão incompleta ou inválida.');
  }

  const sourceLocalTime = toSourceLocalTime(data.current.time);
  const daily = data.daily;
  const dailyDates: unknown[] = Array.isArray(daily.time) ? daily.time : [];
  const startDate = sourceLocalTime?.slice(0, 10) ?? toLocalDate(dailyDates[0]);
  if (startDate === null) {
    throw serviceError('weather', 'invalid-response', 'Previsão sem data local válida.');
  }

  const weatherCode = toWeatherCode(data.current.weather_code);
  const current: CurrentWeather = {
    temperatureCelsius: toFiniteNumber(data.current.temperature_2m),
    weatherCode,
    descriptionPtBr: getWeatherCondition(weatherCode)?.description ?? null,
    sourceLocalTime,
    humidityPercent: toMetricNumber(data.current.relative_humidity_2m, 0, 100),
    windSpeedKmh: toMetricNumber(data.current.wind_speed_10m, 0),
    precipitationMm: toMetricNumber(data.current.precipitation, 0),
    pressureHpa: toMetricNumber(data.current.surface_pressure, Number.MIN_VALUE),
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
      precipitationProbabilityPercent: toMetricNumber(
        Array.isArray(daily.precipitation_probability_max)
          ? daily.precipitation_probability_max[index]
          : undefined,
        0,
        100,
      ),
    };
  });

  if (
    current.temperatureCelsius === null &&
    current.weatherCode === null &&
    current.humidityPercent === null &&
    current.windSpeedKmh === null &&
    current.precipitationMm === null &&
    current.pressureHpa === null &&
    !forecast.some(
      (day) =>
        day.minimumCelsius !== null ||
        day.maximumCelsius !== null ||
        day.weatherCode !== null ||
        day.precipitationProbabilityPercent !== null,
    )
  ) {
    throw serviceError('weather', 'invalid-response', 'Previsão sem dados meteorológicos válidos.');
  }

  return {
    city,
    current,
    forecast,
    timeZone: typeof data.timezone === 'string' && data.timezone.trim() ? data.timezone : null,
    utcOffsetSeconds: toFiniteNumber(data.utc_offset_seconds),
  };
}
