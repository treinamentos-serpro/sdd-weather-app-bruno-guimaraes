export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number | null;
  name: string;
  country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureCelsius: number | null;
  weatherCode: number | null;
  descriptionPtBr: string | null;
  sourceLocalTime: string | null;
  humidityPercent?: number | null;
  windSpeedKmh?: number | null;
  precipitationMm?: number | null;
  pressureHpa?: number | null;
}

export interface ForecastDay {
  localDate: string;
  minimumCelsius: number | null;
  maximumCelsius: number | null;
  weatherCode: number | null;
  descriptionPtBr: string | null;
  precipitationProbabilityPercent?: number | null;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  timeZone: string | null;
  utcOffsetSeconds: number | null;
}
