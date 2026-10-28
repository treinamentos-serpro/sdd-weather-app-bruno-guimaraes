import { type Ref, useId } from 'react';
import { formatMeasurement, UNAVAILABLE } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
  timeZone?: string | null;
  utcOffsetSeconds?: number | null;
  headingRef?: Ref<HTMLHeadingElement>;
}

function formatSourceLocalTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, seconds = '00'] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(seconds),
    ),
  );
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCHours() !== Number(hour) ||
    date.getUTCMinutes() !== Number(minute) ||
    date.getUTCSeconds() !== Number(seconds)
  ) {
    return null;
  }

  return `${day}/${month}/${year} às ${hour}:${minute}`;
}

function isValidUtcOffset(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 14 * 60 * 60;
}

export default function CurrentWeather({
  city,
  current,
  unit,
  timeZone,
  utcOffsetSeconds,
  headingRef,
}: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode);
  const temperature = formatTemperature(current.temperatureCelsius, unit);
  const description = current.descriptionPtBr?.trim() || condition?.description || UNAVAILABLE;
  const location = [city.region, city.country].filter(Boolean).join(', ');
  const sourceTimestamp = current.sourceLocalTime;
  const sourceLocalTime =
    typeof sourceTimestamp === 'string' ? formatSourceLocalTime(sourceTimestamp) : null;
  const sourceTimestampMs =
    typeof sourceTimestamp === 'string' && sourceLocalTime !== null
      ? new Date(`${sourceTimestamp}${sourceTimestamp.length === 16 ? ':00' : ''}Z`).getTime()
      : null;
  const isStale =
    sourceTimestampMs !== null &&
    Number.isFinite(sourceTimestampMs) &&
    isValidUtcOffset(utcOffsetSeconds) &&
    Date.now() - (sourceTimestampMs - utcOffsetSeconds * 1000) > 2 * 60 * 60 * 1000;
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
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="mt-1 break-words rounded-lg text-2xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 sm:text-3xl"
        >
          {city.name}
        </h2>
        {location && <p className="mt-1 text-sm text-white/70">{location}</p>}
        {sourceLocalTime && (
          <div className="mt-2 text-sm text-white/70">
            <p>
              Dados observados em horário local
              {timeZone && ` (${timeZone})`}: <time>{sourceLocalTime}</time>
            </p>
            {isStale && <p className="font-medium text-amber-200">Condições desatualizadas</p>}
          </div>
        )}
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
