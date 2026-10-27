import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const cityResult = {
  id: 2267057,
  name: 'Lisboa',
  country: 'Portugal',
  admin1: 'Distrito de Lisboa',
  latitude: 38.72509,
  longitude: -9.1498,
};

function mockResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe.each([
  {
    operation: 'searchCities',
    request: () => searchCities('Lisboa'),
    body: { results: [cityResult] },
  },
  {
    operation: 'getWeather',
    request: () => getWeather({ ...cityResult, region: cityResult.admin1 }),
    body: {
      current: { time: '2026-12-30T12:00', temperature_2m: 20 },
      daily: {},
    },
  },
])('$operation: transporte', ({ request, body }) => {
  it('limpa o timer após sucesso e não aborta a requisição concluída', async () => {
    vi.useFakeTimers();
    const fetchMock = mockResponse(body);

    await request();

    const signal: AbortSignal = fetchMock.mock.calls[0][1].signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(signal.aborted).toBe(false);
  });

  it.each([
    [new DOMException('Aborted', 'AbortError'), 'A requisição demorou demais.'],
    [new TypeError('Failed to fetch'), 'Falha de rede.'],
  ])('converte %s em WeatherServiceError e limpa o timer', async (error, message) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(request()).rejects.toThrow(new WeatherServiceError(message));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborta somente ao completar 10 segundos e limpa o timer', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      }),
    );

    const result = expect(request()).rejects.toThrow(
      new WeatherServiceError('A requisição demorou demais.'),
    );

    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('searchCities', () => {
  it.each(['', '   ', '\n\t'])('retorna vazio sem chamar a rede para %j', async (name) => {
    const fetchMock = mockResponse({});

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const city: City = {
    id: cityResult.id,
    name: cityResult.name,
    country: cityResult.country,
    region: cityResult.admin1,
    latitude: cityResult.latitude,
    longitude: cityResult.longitude,
  };

  function forecastResponse() {
    return {
      timezone: 'Europe/Lisbon',
      utc_offset_seconds: 3600,
      current: { time: '2026-12-30T23:15', temperature_2m: 0, weather_code: 0 },
      daily: {
        time: ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'],
        temperature_2m_min: [-2.5, 0, 1.2, 2, 3],
        temperature_2m_max: [5.5, 6, 7.2, 8, 9],
        weather_code: [3, 1, 0, 61, 999],
      },
    };
  }

  describe('getWeather', () => {
    it('consulta as coordenadas com current, daily, Celsius e cinco dias locais', async () => {
      const fetchMock = mockResponse(forecastResponse());

      await getWeather(city);

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://api.open-meteo.com/v1/forecast?latitude=38.72509&longitude=-9.1498&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=auto&forecast_days=5',
        { signal: expect.any(AbortSignal) },
      );
    });

    it('mapeia current e os arrays paralelos preservando cidade, precisão e zeros', async () => {
      mockResponse(forecastResponse());

      const result = await getWeather(city);

      expect(result.city).toBe(city);
      expect(result.current).toEqual({
        temperatureCelsius: 0,
        weatherCode: 0,
        descriptionPtBr: 'Céu limpo',
        sourceLocalTime: '2026-12-30T23:15',
      });
      expect(result.timeZone).toBe('Europe/Lisbon');
      expect(result.utcOffsetSeconds).toBe(3600);
      expect(result.forecast).toEqual([
        {
          localDate: '2026-12-30',
          minimumCelsius: -2.5,
          maximumCelsius: 5.5,
          weatherCode: 3,
          descriptionPtBr: 'Nublado',
        },
        {
          localDate: '2026-12-31',
          minimumCelsius: 0,
          maximumCelsius: 6,
          weatherCode: 1,
          descriptionPtBr: 'Predominantemente limpo',
        },
        {
          localDate: '2027-01-01',
          minimumCelsius: 1.2,
          maximumCelsius: 7.2,
          weatherCode: 0,
          descriptionPtBr: 'Céu limpo',
        },
        {
          localDate: '2027-01-02',
          minimumCelsius: 2,
          maximumCelsius: 8,
          weatherCode: 61,
          descriptionPtBr: 'Chuva leve',
        },
        {
          localDate: '2027-01-03',
          minimumCelsius: 3,
          maximumCelsius: 9,
          weatherCode: 999,
          descriptionPtBr: null,
        },
      ]);
    });

    it('mantém cinco dias e os índices originais mesmo com datas ausentes ou fora de ordem', async () => {
      const body = forecastResponse();
      body.daily = {
        time: ['2027-01-01', '2026-12-30', '2027-01-05'],
        temperature_2m_min: [1, -2, 20],
        temperature_2m_max: [7, 5, 30],
        weather_code: [0, 3, 61],
      };
      mockResponse(body);

      const { forecast } = await getWeather(city);

      expect(forecast).toHaveLength(5);
      expect(forecast.map((day) => day.localDate)).toEqual(forecastResponse().daily.time);
      expect(forecast.map((day) => day.minimumCelsius)).toEqual([-2, null, 1, null, null]);
      expect(forecast[1]).toEqual({
        localDate: '2026-12-31',
        minimumCelsius: null,
        maximumCelsius: null,
        weatherCode: null,
        descriptionPtBr: null,
      });
    });

    it('normaliza campos inválidos sem deslocar arrays nem descartar dados parciais', async () => {
      mockResponse({
        ...forecastResponse(),
        timezone: '',
        utc_offset_seconds: '3600',
        current: { temperature_2m: '20', weather_code: null, time: '2026-02-30T12:00' },
        daily: {
          ...forecastResponse().daily,
          temperature_2m_min: [null, '0', 1.25],
          temperature_2m_max: {},
          weather_code: [-1, 1.5, 0],
        },
      });

      const result = await getWeather(city);

      expect(result.current).toEqual({
        temperatureCelsius: null,
        weatherCode: null,
        descriptionPtBr: null,
        sourceLocalTime: null,
      });
      expect(result.timeZone).toBeNull();
      expect(result.utcOffsetSeconds).toBeNull();
      expect(result.forecast.map((day) => day.minimumCelsius)).toEqual([
        null,
        null,
        1.25,
        null,
        null,
      ]);
      expect(result.forecast.map((day) => day.maximumCelsius)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(result.forecast.map((day) => day.weatherCode)).toEqual([null, null, 0, null, null]);
    });

    it.each([
      null,
      {},
      { error: true, ...forecastResponse() },
      { daily: forecastResponse().daily },
      { current: forecastResponse().current },
      { ...forecastResponse(), current: null },
      { ...forecastResponse(), daily: null },
      { ...forecastResponse(), current: [] },
      { ...forecastResponse(), daily: [] },
      { current: {}, daily: {} },
      { current: { time: '2026-12-30T12:00' }, daily: {} },
    ])('lança WeatherServiceError para resposta incompleta ou inválida: %j', async (body) => {
      mockResponse(body);

      await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
    });

    it.each([400, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
      mockResponse({}, status);

      await expect(getWeather(city)).rejects.toThrow(WeatherServiceError);
    });

    it('converte falhas de rede em WeatherServiceError', async () => {
      const error = new TypeError('Falha de rede');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

      await expect(getWeather(city)).rejects.toThrow(new WeatherServiceError('Falha de rede.'));
    });

    it('propaga JSON inválido sem produzir sucesso vazio', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

      await expect(getWeather(city)).rejects.toThrow(SyntaxError);
    });
  });

  it('apara e codifica o nome preservando acentos, espaços internos e pontuação', async () => {
    const fetchMock = mockResponse({});

    await searchCities('  São Paulo & região?  ');

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o%3F&count=10&language=pt&format=json',
      { signal: expect.any(AbortSignal) },
    );
  });

  it('mapeia os resultados para City e preserva a ordem', async () => {
    mockResponse({
      results: [cityResult, { name: 'Outra cidade', latitude: 0, longitude: 0 }],
    });

    await expect(searchCities('Lisboa')).resolves.toEqual([
      {
        id: 2267057,
        name: 'Lisboa',
        country: 'Portugal',
        region: 'Distrito de Lisboa',
        latitude: 38.72509,
        longitude: -9.1498,
      },
      {
        id: null,
        name: 'Outra cidade',
        country: null,
        region: null,
        latitude: 0,
        longitude: 0,
      },
    ]);
  });

  it('normaliza campos opcionais inválidos para null', async () => {
    mockResponse({ results: [{ ...cityResult, id: 'id', country: '', admin1: 42 }] });

    await expect(searchCities('Lisboa')).resolves.toEqual([
      {
        id: null,
        name: 'Lisboa',
        country: null,
        region: null,
        latitude: 38.72509,
        longitude: -9.1498,
      },
    ]);
  });

  it.each([
    {},
    { results: [] },
  ])('retorna vazio quando não há correspondências: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it.each([400, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
    mockResponse({}, status);

    await expect(searchCities('Lisboa')).rejects.toThrow(WeatherServiceError);
  });

  it.each([
    null,
    { error: true, reason: 'Invalid parameters' },
    { results: null },
    { results: {} },
    { results: [null] },
    { results: [{ ...cityResult, name: '' }] },
    { results: [{ ...cityResult, latitude: '38' }] },
    { results: [{ ...cityResult, latitude: 91 }] },
    { results: [{ ...cityResult, longitude: -181 }] },
  ])('rejeita respostas inválidas: %j', async (body) => {
    mockResponse(body);

    await expect(searchCities('Lisboa')).rejects.toThrow(WeatherServiceError);
  });

  it('propaga falhas de rede sem convertê-las em resultado vazio', async () => {
    const error = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(searchCities('Lisboa')).rejects.toThrow(new WeatherServiceError('Falha de rede.'));
  });
});
