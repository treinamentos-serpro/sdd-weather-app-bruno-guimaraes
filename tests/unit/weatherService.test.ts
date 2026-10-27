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

const SEARCH_FAILURE = 'Não foi possível buscar a cidade.';
const WEATHER_FAILURE = 'Não foi possível carregar a previsão do tempo.';
const TIMEOUT_HINT = 'O serviço de clima não respondeu em 10 segundos.';
const NETWORK_HINT = 'Não foi possível conectar ao serviço de clima.';
const OFFLINE_HINT = 'Você está sem conexão com a internet.';

function goOffline() {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each([
  {
    operation: 'searchCities',
    prefix: SEARCH_FAILURE,
    request: () => searchCities('Lisboa'),
    body: { results: [cityResult] },
  },
  {
    operation: 'getWeather',
    prefix: WEATHER_FAILURE,
    request: () => getWeather({ ...cityResult, region: cityResult.admin1 }),
    body: {
      current: { time: '2026-12-30T12:00', temperature_2m: 20 },
      daily: {},
    },
  },
])('$operation: transporte', ({ request, body, prefix }) => {
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
    [new DOMException('Aborted', 'AbortError'), 'timeout', TIMEOUT_HINT],
    [new TypeError('Failed to fetch'), 'network', NETWORK_HINT],
  ])('converte %s em WeatherServiceError e limpa o timer', async (error, kind, hint) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    const rejection = await request().catch((caught: unknown) => caught);

    expect(rejection).toBeInstanceOf(WeatherServiceError);
    expect(rejection).toMatchObject({ kind, message: expect.stringContaining(prefix) });
    expect((rejection as Error).message).toContain(hint);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('informa que o dispositivo está offline quando o fetch falha sem conexão', async () => {
    goOffline();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(request()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'network',
      message: `${prefix} ${OFFLINE_HINT} Reconecte-se e tente novamente.`,
    });
  });

  it('não expõe detalhes técnicos na mensagem, apenas em detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('ERR_INTERNET_DISCONNECTED')));

    const rejection = (await request().catch((caught: unknown) => caught)) as WeatherServiceError;

    expect(rejection.message).not.toContain('ERR_INTERNET_DISCONNECTED');
    expect(rejection.detail).toContain('ERR_INTERNET_DISCONNECTED');
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

    const result = expect(request()).rejects.toMatchObject({
      kind: 'timeout',
      message: `${prefix} ${TIMEOUT_HINT} Verifique sua conexão e tente novamente.`,
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('encerra como timeout quando o corpo não termina em 10 segundos', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, options: RequestInit) => {
        const body = new ReadableStream({
          start(controller) {
            options.signal?.addEventListener('abort', () =>
              controller.error(new DOMException('Aborted', 'AbortError')),
            );
          },
        });
        return new Response(body, { status: 200 });
      }),
    );

    let outcome: unknown = 'pendente';
    request().then(
      () => {
        outcome = 'sucesso';
      },
      (error: unknown) => {
        outcome = error;
      },
    );
    await vi.advanceTimersByTimeAsync(10_000);

    expect(outcome).toBeInstanceOf(WeatherServiceError);
    expect(outcome).toMatchObject({ kind: 'timeout' });
  });

  it('converte erro de rede durante a leitura do corpo em WeatherServiceError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new TypeError('terminated'));
            },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(request()).rejects.toMatchObject({ kind: 'network' });
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

    it('normaliza -0.0 da Open-Meteo para 0 em todos os campos numéricos', async () => {
      const body = forecastResponse();
      mockResponse({
        ...body,
        current: { ...body.current, temperature_2m: -0, precipitation: -0, wind_speed_10m: -0 },
        daily: {
          ...body.daily,
          temperature_2m_min: [-0, ...body.daily.temperature_2m_min.slice(1)],
          precipitation_probability_max: [-0, ...body.daily.precipitation_probability_max.slice(1)],
        },
      });

      const { current, forecast } = await getWeather(city);

      expect(Object.is(current.temperatureCelsius, 0)).toBe(true);
      expect(Object.is(current.precipitationMm, 0)).toBe(true);
      expect(Object.is(current.windSpeedKmh, 0)).toBe(true);
      expect(Object.is(forecast[0].minimumCelsius, 0)).toBe(true);
      expect(Object.is(forecast[0].precipitationProbabilityPercent, 0)).toBe(true);
    });

    it('mantém precipitação null como null (Indisponível) e preserva zeros válidos', async () => {
      mockResponse({
        ...forecastResponse(),
        current: { ...forecastResponse().current, precipitation: null },
        daily: {
          ...forecastResponse().daily,
          precipitation_probability_max: [null, 0, null, 100, null],
        },
      });

      const result = await getWeather(city);

      expect(result.current.precipitationMm).toBeNull();
      expect(result.current.temperatureCelsius).toBe(0);
      expect(result.forecast.map((day) => day.precipitationProbabilityPercent)).toEqual([
        null,
        0,
        null,
        100,
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

    it.each([
      ['current', { daily: forecastResponse().daily }],
      ['daily', { current: forecastResponse().current }],
    ])('informa resposta incompleta quando %s está ausente', async (_field, body) => {
      mockResponse(body);

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'invalid-response',
        message: `${WEATHER_FAILURE} Os dados recebidos estão incompletos ou em formato inesperado. Tente novamente.`,
      });
    });

    it.each([400, 500])('lança WeatherServiceError para HTTP %i', async (status) => {
      mockResponse({}, status);

      const rejection = await getWeather(city).catch((caught: unknown) => caught);

      expect(rejection).toBeInstanceOf(WeatherServiceError);
      expect(rejection).toMatchObject({ kind: 'http', status });
    });

    it('converte falhas de rede em WeatherServiceError', async () => {
      const error = new TypeError('Falha de rede');
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'network',
        message: expect.stringContaining(NETWORK_HINT),
      });
    });

    it('normaliza JSON inválido sem produzir sucesso vazio', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid json')));

      await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
    });

    it.each([
      [200, 'api'],
      [400, 'http'],
    ])('guarda o motivo da API em detail, fora da mensagem, para HTTP %i', async (status, kind) => {
      mockResponse({ error: true, reason: 'Invalid parameters' }, status);

      const rejection = (await getWeather(city).catch(
        (caught: unknown) => caught,
      )) as WeatherServiceError;

      expect(rejection).toMatchObject({
        kind,
        detail: expect.stringContaining('Invalid parameters'),
      });
      expect(rejection.message).toMatch(new RegExp(`^${WEATHER_FAILURE}`));
      expect(rejection.message).not.toContain('Invalid parameters');
    });

    it('preserva o status HTTP quando o corpo não contém JSON válido', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })),
      );

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'http',
        status: 502,
        message: `${WEATHER_FAILURE} O serviço de clima está temporariamente indisponível. Tente novamente em alguns instantes.`,
      });
    });

    it('ancora os cinco dias na data local de current.time, não em daily.time[0]', async () => {
      const body = forecastResponse();
      body.current.time = '2026-12-31T00:30';
      mockResponse(body);

      const { forecast } = await getWeather(city);

      expect(forecast.map((day) => day.localDate)).toEqual([
        '2026-12-31',
        '2027-01-01',
        '2027-01-02',
        '2027-01-03',
        '2027-01-04',
      ]);
      expect(forecast[0]).toMatchObject({ minimumCelsius: 0, maximumCelsius: 6, weatherCode: 1 });
      expect(forecast[4]).toEqual({
        localDate: '2027-01-04',
        minimumCelsius: null,
        maximumCelsius: null,
        weatherCode: null,
        descriptionPtBr: null,
        precipitationProbabilityPercent: null,
      });
    });

    it('não usa a data do dispositivo quando a fonte não fornece data local válida', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-12-30T12:00:00Z'));
      mockResponse({
        ...forecastResponse(),
        current: { ...forecastResponse().current, time: 'ontem' },
        daily: { ...forecastResponse().daily, time: ['2026-13-01', null] },
      });

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'invalid-response',
        detail: 'Previsão sem data local válida.',
      });
    });

    it('rejeita quando só há dados válidos fora da janela de cinco dias', async () => {
      mockResponse({
        current: { time: '2026-12-30T12:00', temperature_2m: null, weather_code: null },
        daily: {
          time: ['2027-01-04', '2027-01-05'],
          temperature_2m_min: [10, 11],
          temperature_2m_max: [20, 21],
          weather_code: [0, 1],
          precipitation_probability_max: [5, 6],
        },
      });

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'invalid-response',
        detail: 'Previsão sem dados meteorológicos válidos.',
      });
    });

    it('aceita resposta em que só a temperatura atual é válida e marca o resto como ausente', async () => {
      mockResponse({ current: { time: '2026-12-30T12:00', temperature_2m: -3.5 }, daily: {} });

      const result = await getWeather(city);

      expect(result.current).toMatchObject({
        temperatureCelsius: -3.5,
        weatherCode: null,
        descriptionPtBr: null,
      });
      expect(result.forecast).toHaveLength(5);
      expect(
        result.forecast.every((day) => day.minimumCelsius === null && day.maximumCelsius === null),
      ).toBe(true);
    });

    it.each([
      [429, 'Too many requests', 'Muitas consultas em pouco tempo.'],
      [503, 'Service unavailable', 'O serviço de clima está temporariamente indisponível.'],
    ])('trata limite/indisponibilidade HTTP %i com mensagem amigável', async (status, reason, hint) => {
      mockResponse({ error: true, reason }, status);

      await expect(getWeather(city)).rejects.toMatchObject({
        kind: 'http',
        status,
        message: expect.stringContaining(hint),
        detail: `Previsão HTTP ${status}. ${reason}`,
      });
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

  it.each([400, 429, 500, 503])('lança WeatherServiceError para HTTP %i', async (status) => {
    mockResponse({ results: [cityResult] }, status);

    await expect(searchCities('Lisboa')).rejects.toMatchObject({
      kind: 'http',
      status,
      message: expect.stringMatching(new RegExp(`^${SEARCH_FAILURE}`)),
    });
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

    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('propaga falhas de rede sem convertê-las em resultado vazio', async () => {
    const error = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));

    await expect(searchCities('Lisboa')).rejects.toMatchObject({ kind: 'network' });
  });
});
