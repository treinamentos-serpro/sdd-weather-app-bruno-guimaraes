import { useId } from 'react';
import { formatMeasurement, UNAVAILABLE } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  const temperature = formatTemperature(current.temperatureCelsius, unit);
  const description = current.descriptionPtBr?.trim() || condition?.description || UNAVAILABLE;
  const location = [city.region, city.country].filter(Boolean).join(', ');
  const metrics = [
    {
      label: 'Umidade',
      value: formatMeasurement(current.humidityPercent, '%', { min: 0, max: 100 }),
    },
    { label: 'Vento', value: formatMeasurement(current.windSpeedKmh, 'km/h', { min: 0 }) },
    { label: 'Precipitação', value: formatMeasurement(current.precipitationMm, 'mm', { min: 0 }) },
    {
      label: 'Pressão',
      value: formatMeasurement(current.pressureHpa, 'hPa', { min: Number.MIN_VALUE }),
    },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md sm:p-8"
    >
      <header>
        <p className="text-sm font-medium text-accent-400">Clima atual</p>
        <h2 id={headingId} className="mt-1 break-words text-2xl font-semibold sm:text-3xl">
          {city.name}
        </h2>
        {location && <p className="mt-1 text-sm text-white/70">{location}</p>}
      </header>

      <div className="my-8 flex flex-wrap items-center gap-6 sm:gap-8">
        <span aria-hidden="true" className="text-6xl sm:text-8xl">
          {condition?.icon ?? '—'}
        </span>
        <div className="min-w-0">
          <output
            aria-label={`Temperatura: ${temperature}`}
            className="block text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            {temperature}
          </output>
          <p className="mt-2 text-lg text-white/80">{description}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-sm text-white/70">{label}</dt>
            <dd className="mt-1 break-words text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
