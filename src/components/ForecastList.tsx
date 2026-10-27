import { useId } from 'react';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="text-white">
      <h2 id={headingId} className="mb-4 text-2xl font-semibold">
        Previsão de 5 dias
      </h2>
      {forecast.length === 0 ? (
        <p role="status" className="text-white/70">
          Previsão indisponível.
        </p>
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day, index) => (
            <li key={day.localDate} className="min-w-0">
              <ForecastCard day={day} index={index} unit={unit} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
