import { useId } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

function locationContext(city: City): string {
  return [city.region, city.country].filter(Boolean).join(', ');
}

function coordinates(city: City): string {
  const formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });
  return `${formatter.format(city.latitude)}, ${formatter.format(city.longitude)}`;
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  const headingId = useId();
  const contextCounts = new Map<string, number>();

  for (const city of cities) {
    const key = `${city.name}\u0000${locationContext(city)}`;
    contextCounts.set(key, (contextCounts.get(key) ?? 0) + 1);
  }

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md"
    >
      <h2 id={headingId} className="text-xl font-semibold">
        Selecione uma cidade
      </h2>
      <ol aria-label="Resultados da busca" className="mt-4 space-y-3">
        {cities.map((city) => {
          const context = locationContext(city);
          const key = `${city.name}\u0000${context}`;
          const hasAmbiguousContext = (contextCounts.get(key) ?? 0) > 1;
          const details = [
            context,
            hasAmbiguousContext ? `Coordenadas: ${coordinates(city)}` : null,
          ].filter(Boolean);

          return (
            <li key={`${city.id ?? 'no-id'}-${city.latitude}-${city.longitude}`}>
              <button
                type="button"
                onClick={() => onSelect(city)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <span className="block font-semibold">{city.name}</span>
                {details.length > 0 && (
                  <span className="mt-1 block text-sm text-white/70">{details.join(' · ')}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
