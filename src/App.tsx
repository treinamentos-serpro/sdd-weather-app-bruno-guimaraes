import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { mockWeatherData } from './mocks/weather';
import type { Unit } from './types/weather';

const scenarios = [
  { value: 'idle', label: 'Inicial' },
  { value: 'loading', label: 'Carregando' },
  { value: 'empty', label: 'Sem resultados' },
  { value: 'error', label: 'Erro' },
  { value: 'success', label: 'Sucesso' },
] as const;

type ViewStatus = (typeof scenarios)[number]['value'];

export default function App() {
  const [status, setStatus] = useState<ViewStatus>('success');
  const [unit, setUnit] = useState<Unit>('celsius');

  function showMockWeather() {
    setStatus('success');
  }

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
          <SearchBar onSearch={showMockWeather} disabled={status === 'loading'} />
          <div className="justify-self-start lg:justify-self-end">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </header>

        <aside
          aria-label="Demonstração com dados mock"
          className="my-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="max-w-xl text-sm text-slate-300">
            Demonstração com dados fictícios e fixos, sem consulta à API. Buscar ou tentar novamente
            sempre exibe São Paulo, independentemente do texto informado. Os dados não representam o
            clima atual.
          </p>
          <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
            <label htmlFor="view-status" className="mb-2 block text-sm font-medium">
              Estado da demonstração
            </label>
            <select
              id="view-status"
              value={status}
              onChange={(event) => {
                const scenario = scenarios.find((item) => item.value === event.target.value);
                if (scenario) setStatus(scenario.value);
              }}
              className="w-full rounded-xl border border-white/10 bg-night-900 px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.value} value={scenario.value}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          aria-label="Condições meteorológicas"
          aria-busy={status === 'loading'}
          className="space-y-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          {status === 'idle' && (
            <EmptyState
              title="Consulte o clima de uma cidade"
              hint="Digite o nome de uma cidade e selecione Buscar para visualizar a demonstração."
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
              message="Não foi possível obter os dados meteorológicos."
              onRetry={showMockWeather}
            />
          )}
          {status === 'success' && (
            <>
              <CurrentWeather
                city={mockWeatherData.city}
                current={mockWeatherData.current}
                unit={unit}
              />
              <ForecastList forecast={mockWeatherData.forecast} unit={unit} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
