import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    country: 'Brasil',
    region: 'São Paulo',
    latitude: -23.5475,
    longitude: -46.6361,
  },
  current: {
    temperatureCelsius: 24.5,
    weatherCode: 2,
    descriptionPtBr: 'Parcialmente nublado',
    sourceLocalTime: '2026-10-27T15:00',
  },
  forecast: [
    {
      localDate: '2026-10-27',
      minimumCelsius: 18.2,
      maximumCelsius: 27.5,
      weatherCode: 2,
      descriptionPtBr: 'Parcialmente nublado',
    },
    {
      localDate: '2026-10-28',
      minimumCelsius: 19.1,
      maximumCelsius: 29.3,
      weatherCode: 0,
      descriptionPtBr: 'Céu limpo',
    },
    {
      localDate: '2026-10-29',
      minimumCelsius: 20.4,
      maximumCelsius: 26.8,
      weatherCode: 61,
      descriptionPtBr: 'Chuva leve',
    },
    {
      localDate: '2026-10-30',
      minimumCelsius: 17.6,
      maximumCelsius: 23.2,
      weatherCode: 3,
      descriptionPtBr: 'Nublado',
    },
    {
      localDate: '2026-10-31',
      minimumCelsius: 16.8,
      maximumCelsius: 25.6,
      weatherCode: 1,
      descriptionPtBr: 'Predominantemente limpo',
    },
  ],
  timeZone: 'America/Sao_Paulo',
  utcOffsetSeconds: -10800,
};
