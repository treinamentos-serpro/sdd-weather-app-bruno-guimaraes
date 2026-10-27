import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const { status, data, error, search, retry } = useWeather();
  const [unit, setUnit] = useState<Unit>('celsius');
  const mainRef = useRef<HTMLElement>(null);

  // Busca e retry desabilitam/desmontam o controle focado; o foco vai para o main
  // para não se perder no body.
  function handleSearch(city: string) {
    search(city);
    mainRef.current?.focus();
  }

  function handleRetry() {
    retry();
    mainRef.current?.focus();
  }

  const announcement =
    status === 'loading'
      ? 'Carregando dados meteorológicos...'
      : status === 'success' && data
        ? `Clima de ${data.city.name} carregado.`
        : status === 'empty'
          ? 'Nenhuma cidade encontrada.'
          : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-night-900 via-night-800 to-night-900 font-sans text-white">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-night-900 p-3 focus:not-sr-only focus:absolute focus:z-10 focus:ring-2 focus:ring-accent-400"
      >
        Ir para o conteúdo
      </a>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="grid min-w-0 items-center gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent-400">
              SDD Weather App
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              <span aria-hidden="true" className="mr-2 text-sun">
                ☀
              </span>
              WeatherView
            </h1>
          </div>
          <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />
          <div className="justify-self-start lg:justify-self-end">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </header>

        {/* Região viva persistente fora do main: aria-busy no main não a silencia. */}
        <p role="status" className="sr-only">
          {announcement}
        </p>

        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          aria-label="Condições meteorológicas"
          aria-busy={status === 'loading'}
          className="mt-8 space-y-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Consulte o clima de uma cidade"
              hint="Digite o nome de uma cidade e selecione Buscar para consultar o clima."
            />
          )}
          {status === 'loading' && <LoadingState />}
          {status === 'empty' && (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint="Confira o nome da cidade e tente uma nova busca."
            />
          )}
          {status === 'error' && (
            <ErrorState
              message={error ?? 'Não foi possível obter os dados meteorológicos.'}
              onRetry={handleRetry}
            />
          )}
          {status === 'success' && data && (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList forecast={data.forecast} unit={unit} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
