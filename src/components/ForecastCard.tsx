import { useId } from 'react';
import { formatMeasurement, getDayLabel, getShortDate, UNAVAILABLE } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const headingId = useId();
  const condition = getWeatherCondition(day.weatherCode);
  const description = day.descriptionPtBr?.trim() || condition?.description || UNAVAILABLE;
  const shortDate = getShortDate(day.localDate);
  const rain = formatMeasurement(day.precipitationProbabilityPercent, '%', { min: 0, max: 100 });

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h3 id={headingId} className="break-words text-lg font-semibold">
        {getDayLabel(day.localDate, index)}
      </h3>
      <p className="mt-1 text-sm text-white/70">
        {shortDate === UNAVAILABLE ? (
          'Data indisponível'
        ) : (
          <time dateTime={day.localDate}>{shortDate}</time>
        )}
      </p>
      <span aria-hidden="true" className="my-4 block text-4xl">
        {condition?.icon ?? '—'}
      </span>
      <p className="text-sm text-white/80">{description}</p>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm text-white/70">Máxima</dt>
          <dd className="break-words text-lg font-semibold text-sun">
            {formatTemperature(day.maximumCelsius, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-white/70">Mínima</dt>
          <dd className="break-words text-lg font-semibold">
            {formatTemperature(day.minimumCelsius, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-white/70">Probabilidade de chuva</dt>
          <dd className="mt-1 break-words font-medium text-accent-400">{rain}</dd>
        </div>
      </dl>
    </article>
  );
}
