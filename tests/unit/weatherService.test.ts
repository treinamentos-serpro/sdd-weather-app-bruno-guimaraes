import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

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
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it.each(['', '   ', '\n\t'])('retorna vazio sem chamar a rede para %j', async (name) => {
    const fetchMock = mockResponse({});

    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('apara e codifica o nome preservando acentos, espaços internos e pontuação', async () => {
    const fetchMock = mockResponse({});

    await searchCities('  São Paulo & região?  ');

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo%20%26%20regi%C3%A3o%3F&count=10&language=pt&format=json',
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

  it.each([{}, { results: [] }])('retorna vazio quando não há correspondências: %j', async (body) => {
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

    await expect(searchCities('Lisboa')).rejects.toBe(error);
  });
});
