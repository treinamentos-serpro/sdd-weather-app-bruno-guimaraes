import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getWeather,
  searchCities,
  type WeatherErrorKind,
  WeatherServiceError,
} from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  errorKind: WeatherErrorKind | 'unknown' | null;
  query: string;
}

export const GENERIC_ERROR_MESSAGE =
  'Não foi possível obter os dados meteorológicos. Tente novamente.';

type Operation = { type: 'search'; name: string } | { type: 'weather'; city: City };

const initialState: WeatherState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  errorKind: null,
  query: '',
};

export function useWeather() {
  const [state, setState] = useState<WeatherState>(initialState);
  const requestId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    return () => {
      requestId.current += 1;
      pending.current = false;
    };
  }, []);

  const execute = useCallback(async (operation: Operation) => {
    const id = ++requestId.current;
    lastOperation.current = operation;
    pending.current = true;
    setState((previous) => ({
      ...previous,
      status: 'loading',
      data: null,
      error: null,
      errorKind: null,
      ...(operation.type === 'search' ? { query: operation.name, cities: [] } : {}),
    }));

    try {
      let city: City;
      if (operation.type === 'search') {
        const cities = await searchCities(operation.name);
        if (id !== requestId.current) return;
        const firstCity = cities[0];
        if (!firstCity) {
          setState((previous) => ({ ...previous, status: 'empty', cities }));
          return;
        }
        city = firstCity;
        setState((previous) => ({ ...previous, cities }));
        lastOperation.current = { type: 'weather', city };
      } else {
        city = operation.city;
      }

      const data = await getWeather(city);
      if (id !== requestId.current) return;
      setState((previous) => ({ ...previous, status: 'success', data }));
    } catch (error) {
      if (id !== requestId.current) return;
      // Só mensagens do service são amigáveis; qualquer outra falha usa texto genérico.
      const isServiceError = error instanceof WeatherServiceError;
      setState((previous) => ({
        ...previous,
        status: 'error',
        error: isServiceError ? error.message : GENERIC_ERROR_MESSAGE,
        errorKind: isServiceError ? error.kind : 'unknown',
      }));
    } finally {
      if (id === requestId.current) pending.current = false;
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const query = name.trim();
      if (!query) {
        requestId.current += 1;
        lastOperation.current = null;
        pending.current = false;
        setState(initialState);
        return;
      }
      await execute({ type: 'search', name: query });
    },
    [execute],
  );

  const selectCity = useCallback(
    async (city: City) => {
      await execute({ type: 'weather', city });
    },
    [execute],
  );

  const retry = useCallback(async () => {
    if (lastOperation.current && !pending.current) {
      await execute(lastOperation.current);
    }
  }, [execute]);

  return { ...state, search, selectCity, retry };
}

export default useWeather;
