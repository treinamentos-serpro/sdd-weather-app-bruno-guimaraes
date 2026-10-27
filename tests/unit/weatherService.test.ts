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
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
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
      current: {
        time: '2026-12-30T23:15',
        temperature_2m: 0,
        weather_code: 0,
        relative_humidity_2m: 81,
        wind_speed_10m: 6.9,
        precipitation: 0,
        surface_pressure: 1016.7,
      },
      daily: {
        time: ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'],
        temperature_2m_min: [-2.5, 0, 1.2, 2, 3],
        temperature_2m_max: [5.5, 6, 7.2, 8, 9],
        weather_code: [3, 1, 0, 61, 999],
        precipitation_probability_max: [0, 10, 25.5, 100, 50],
      },
    };
  }

  describe('getWeather', () => {
    it('consulta as coordenadas com current, daily, Celsius e cinco dias locais', async () => {
      const fetchMock = mockResponse(forecastResponse());

      await getWeather(city);

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://api.open-meteo.com/v1/forecast?latitude=38.72509&longitude=-9.1498&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=5',
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
        humidityPercent: 81,
        windSpeedKmh: 6.9,
        precipitationMm: 0,
        pressureHpa: 1016.7,
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
          precipitationProbabilityPercent: 0,
        },
        {
          localDate: '2026-12-31',
          minimumCelsius: 0,
          maximumCelsius: 6,
          weatherCode: 1,
          descriptionPtBr: 'Predominantemente limpo',
          precipitationProbabilityPercent: 10,
        },
        {
          localDate: '2027-01-01',
          minimumCelsius: 1.2,
          maximumCelsius: 7.2,
          weatherCode: 0,
          descriptionPtBr: 'Céu limpo',
          precipitationProbabilityPercent: 25.5,
        },
        {
          localDate: '2027-01-02',
          minimumCelsius: 2,
          maximumCelsius: 8,
          weatherCode: 61,
          descriptionPtBr: 'Chuva leve',
          precipitationProbabilityPercent: 100,
        },
        {
          localDate: '2027-01-03',
          minimumCelsius: 3,
          maximumCelsius: 9,
          weatherCode: 999,
          descriptionPtBr: null,
          precipitationProbabilityPercent: 50,
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
        precipitation_probability_max: [25, 0, 100],
      };
      mockResponse(body);

      const { forecast } = await getWeather(city);

      expect(forecast).toHaveLength(5);
      expect(forecast.map((day) => day.localDate)).toEqual(forecastResponse().daily.time);
      expect(forecast.map((day) => day.minimumCelsius)).toEqual([-2, null, 1, null, null]);
      expect(forecast.map((day) => day.precipitationProbabilityPercent)).toEqual([
        0,
        null,
        25,
        null,
        null,
      ]);
      expect(forecast[1]).toEqual({
        localDate: '2026-12-31',
        minimumCelsius: null,
        maximumCelsius: null,
        weatherCode: null,
        descriptionPtBr: null,
        precipitationProbabilityPercent: null,
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
        humidityPercent: null,
        windSpeedKmh: null,
        precipitationMm: null,
        pressureHpa: null,
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
      [0, 0, 0, 0],
      [100, 100, 100, 100],
      [null, null, null, null],
      [undefined, undefined, undefined, null],
      ['20', '20', '20', null],
      [-1, -1, -1, null],
      [101, 101, 101, null],
      [Number.NaN, Number.NaN, Number.NaN, null],
      [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, null],
    ])('valida percentuais %s e preserva vento/precipitação não negativos', async (humidity, wind, precipitation, percent) => {
      mockResponse({
        ...forecastResponse(),
        current: {
          ...forecastResponse().current,
          relative_humidity_2m: humidity,
          wind_speed_10m: wind,
          precipitation,
        },
        daily: { ...forecastResponse().daily, precipitation_probability_max: [humidity] },
      });

      const result = await getWeather(city);
      const nonNegative =
        typeof wind === 'number' && Number.isFinite(wind) && wind >= 0 ? wind : null;
      expect(result.current.humidityPercent).toBe(percent);
      expect(result.current.windSpeedKmh).toBe(nonNegative);
      expect(result.current.precipitationMm).toBe(nonNegative);
      expect(result.forecast.map((day) => day.precipitationProbabilityPercent)).toEqual([
        percent,
        null,
        null,
        null,
        null,
      ]);
    });

    it.each([
      undefined,
      null,
      '1016',
      0,
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])('normaliza pressão inválida %s como null', async (surfacePressure) => {
      mockResponse({
        ...forecastResponse(),
        current: { ...forecastResponse().current, surface_pressure: surfacePressure },
      });

      expect((await getWeather(city)).current.pressureHpa).toBeNull();
    });

    it.each([
      undefined,
      null,
      {},
      '50',
    ])('aceita resposta parcial sem array de probabilidades: %j', async (probabilities) => {
      mockResponse({
        ...forecastResponse(),
        daily: { ...forecastResponse().daily, precipitation_probability_max: probabilities },
      });

      const result = await getWeather(city);
      expect(result.forecast.map((day) => day.precipitationProbabilityPercent)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(result.forecast[0].minimumCelsius).toBe(-2.5);
    });

    it.each([
      { current: { relative_humidity_2m: 0 }, daily: {} },
      { current: { wind_speed_10m: 0 }, daily: {} },
      { current: { precipitation: 0 }, daily: {} },
      { current: { surface_pressure: 1016.7 }, daily: {} },
      { current: {}, daily: { precipitation_probability_max: [0] } },
    ])('aceita resposta com apenas métricas adicionais válidas: %j', async (partial) => {
      mockResponse({
        current: { time: '2026-12-30T12:00', ...partial.current },
        daily: { time: ['2026-12-30'], ...partial.daily },
      });

      await expect(getWeather(city)).resolves.toMatchObject({ city });
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

    it('normaliza JSON inválido sem produzir sucesso vazio', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

      await expect(getWeather(city)).rejects.toThrow(
        new WeatherServiceError('Resposta de previsão com JSON inválido.'),
      );
    });

    it.each([200, 400])('inclui o motivo declarado pela API para HTTP %i', async (status) => {
      mockResponse({ error: true, reason: 'Invalid parameters' }, status);

      await expect(getWeather(city)).rejects.toThrow(
        new WeatherServiceError(
          status === 200
            ? 'Erro informado pela API de previsão. Invalid parameters'
            : 'Erro ao buscar previsão (HTTP 400). Invalid parameters',
        ),
      );
    });

    it('preserva o status HTTP quando o corpo não contém JSON válido', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })),
      );

      await expect(getWeather(city)).rejects.toThrow(
        new WeatherServiceError('Erro ao buscar previsão (HTTP 502).'),
      );
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

  it('converte JSON inválido em WeatherServiceError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

    await expect(searchCities('Lisboa')).rejects.toThrow(
      new WeatherServiceError('Resposta de geocoding com JSON inválido.'),
    );
  });

  it('propaga falhas de rede sem convertê-las em resultado vazio', async () => {
    const error = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(searchCities('Lisboa')).rejects.toThrow(new WeatherServiceError('Falha de rede.'));
  });
});
