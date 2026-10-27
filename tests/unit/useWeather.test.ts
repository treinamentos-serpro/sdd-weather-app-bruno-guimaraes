import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

const city = mockWeatherData.city;
const otherCity: City = { ...city, id: 1, name: 'Lisboa', latitude: 38.72, longitude: -9.14 };
const otherWeather: WeatherData = { ...mockWeatherData, city: otherCity };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([city, otherCity]);
  vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
});

describe('useWeather', () => {
  it('inicia em idle e retry sem operação não chama serviços', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('normaliza a consulta, mantém a ordem das cidades e carrega a primeira', async () => {
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('  São Paulo  '));

    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(result.current).toMatchObject({
      status: 'success',
      query: 'São Paulo',
      cities: [city, otherCity],
      data: mockWeatherData,
      error: null,
    });
  });

  it('mantém loading durante a busca e durante a previsão', async () => {
    const cities = deferred<City[]>();
    const weather = deferred<WeatherData>();
    vi.mocked(searchCities).mockReturnValue(cities.promise);
    vi.mocked(getWeather).mockReturnValue(weather.promise);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;

    act(() => {
      request = result.current.search('São Paulo');
    });
    expect(result.current.status).toBe('loading');
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => cities.resolve([city]));
    expect(result.current.status).toBe('loading');
    expect(result.current.cities).toEqual([city]);
    expect(result.current.data).toBeNull();

    await act(async () => {
      weather.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.status).toBe('success');
  });

  it('comunica consulta em branco sem rede e permite nova busca', async () => {
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('   '));
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe('Digite o nome de uma cidade.');
    await act(() => result.current.retry());
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();

    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('limpa dados anteriores e termina em empty quando não há cidades', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(searchCities).mockResolvedValue([]);

    await act(() => result.current.search('Inexistente'));

    expect(result.current).toMatchObject({
      status: 'empty',
      query: 'Inexistente',
      cities: [],
      data: null,
      error: null,
    });
    expect(getWeather).toHaveBeenCalledTimes(1);
    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenLastCalledWith('Inexistente');
    expect(searchCities).toHaveBeenCalledTimes(3);
  });

  it('seleciona outra cidade sem refazer geocoding e preserva a consulta e opções', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(getWeather).mockResolvedValue(otherWeather);

    await act(() => result.current.selectCity(otherCity));

    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current).toMatchObject({
      status: 'success',
      query: 'São Paulo',
      cities: [city, otherCity],
      data: otherWeather,
    });
  });

  it('exibe falha de busca e retry repete a consulta normalizada', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new Error('Falha de rede.'));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('  São Paulo '));
    expect(result.current).toMatchObject({
      status: 'error',
      error: 'Falha de rede.',
      data: null,
    });
    expect(getWeather).not.toHaveBeenCalled();

    await act(() => result.current.retry());
    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('retry de previsão automática repete somente a previsão e pode falhar novamente', async () => {
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new Error('Falha de rede.'))
      .mockRejectedValueOnce(new Error('A requisição demorou demais.'));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    expect(result.current.cities).toEqual([city, otherCity]);
    await act(() => result.current.retry());
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('A requisição demorou demais.');
    await act(() => result.current.retry());

    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(vi.mocked(getWeather).mock.calls).toEqual([[city], [city], [city]]);
    expect(result.current.status).toBe('success');
  });

  it('remove dados antigos ao selecionar e retry usa a cidade selecionada', async () => {
    const weather = deferred<WeatherData>();
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    vi.mocked(getWeather).mockReturnValueOnce(weather.promise).mockResolvedValue(otherWeather);
    let request!: Promise<void>;

    act(() => {
      request = result.current.selectCity(otherCity);
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.data).toBeNull();
    await act(async () => {
      weather.reject(new Error('Falha de rede.'));
      await request;
    });
    await act(() => result.current.retry());

    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
    expect(result.current.data).toEqual(otherWeather);
    expect(searchCities).toHaveBeenCalledTimes(1);
  });

  it('expõe uma mensagem para rejeições que não sejam Error', async () => {
    vi.mocked(searchCities).mockRejectedValue(null);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Não foi possível obter os dados meteorológicos.');
  });

  it('não duplica a operação quando retry é acionado durante loading', async () => {
    const weather = deferred<WeatherData>();
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('Falha de rede.'));
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.selectCity(city));
    vi.mocked(getWeather).mockReturnValue(weather.promise);
    let request!: Promise<void>;

    act(() => {
      request = result.current.retry();
    });
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenCalledTimes(2);
    await act(async () => {
      weather.resolve(mockWeatherData);
      await request;
    });
    expect(result.current.status).toBe('success');
  });

  it.each(['success', 'error'] as const)('descarta busca obsoleta com %s', async (outcome) => {
    const cities = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValueOnce(cities.promise);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('Antiga');
    });
    await act(() => result.current.search('Atual'));
    await act(async () => {
      if (outcome === 'success') cities.resolve([otherCity]);
      else cities.reject(new Error('Falha antiga'));
      await request;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.query).toBe('Atual');
    expect(result.current.data).toEqual(mockWeatherData);
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it.each(['success', 'error'] as const)('descarta previsão obsoleta com %s', async (outcome) => {
    const weather = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(weather.promise).mockResolvedValue(otherWeather);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.selectCity(city);
    });
    await act(() => result.current.selectCity(otherCity));
    await act(async () => {
      if (outcome === 'success') weather.resolve(mockWeatherData);
      else weather.reject(new Error('Falha antiga'));
      await request;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(otherWeather);
    await act(() => result.current.retry());
    expect(getWeather).toHaveBeenLastCalledWith(otherCity);
  });

  it('consulta em branco invalida busca pendente', async () => {
    const cities = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(cities.promise);
    const { result } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('São Paulo');
    });
    await act(() => result.current.search(''));
    await act(async () => {
      cities.resolve([city]);
      await request;
    });
    expect(result.current.status).toBe('idle');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('não inicia previsão quando a busca termina após desmontagem', async () => {
    const cities = deferred<City[]>();
    vi.mocked(searchCities).mockReturnValue(cities.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let request!: Promise<void>;
    act(() => {
      request = result.current.search('São Paulo');
    });
    unmount();
    await act(async () => {
      cities.resolve([city]);
      await request;
    });
    expect(getWeather).not.toHaveBeenCalled();
  });
});
