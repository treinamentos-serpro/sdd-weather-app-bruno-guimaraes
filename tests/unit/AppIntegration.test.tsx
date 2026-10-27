import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

// Integração App + useWeather + weatherService real: apenas `fetch` é substituído,
// para validar o caminho completo de normalização, erro e retry sem chamar a API real.

const geocoding = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      country: 'Brasil',
      admin1: 'São Paulo',
      latitude: -23.5475,
      longitude: -46.63611,
    },
  ],
};

const forecast = {
  timezone: 'America/Sao_Paulo',
  utc_offset_seconds: -10_800,
  current: {
    time: '2026-01-10T12:00',
    temperature_2m: 20,
    weather_code: 0,
    relative_humidity_2m: 65,
    wind_speed_10m: 12,
    precipitation: 0,
    surface_pressure: 1013,
  },
  daily: {
    time: ['2026-01-10', '2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14'],
    weather_code: [0, 1, 2, 3, 61],
    temperature_2m_max: [25, 26, 27, 28, 29],
    temperature_2m_min: [15, 16, 17, 18, 19],
    precipitation_probability_max: [0, 10, 20, 30, 80],
  },
};

type Reply = { body: unknown; status?: number } | 'network-error' | 'hang';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch(forecastReplies: Reply[]) {
  const fetchMock = vi.fn((url: string, options: RequestInit) => {
    if (url.startsWith('https://geocoding-api.open-meteo.com/')) {
      return Promise.resolve(json(geocoding));
    }
    const reply = forecastReplies.shift() ?? { body: forecast };
    if (reply === 'network-error') return Promise.reject(new TypeError('Failed to fetch'));
    if (reply === 'hang') {
      return new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });
    }
    return Promise.resolve(json(reply.body, reply.status));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const forecastCalls = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url]) => url.startsWith('https://api.open-meteo.com/'));

async function searchSaoPaulo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('App integrado ao serviço (fetch stubado)', () => {
  it.each([
    ['HTTP 500', { body: { error: true, reason: 'Internal error' }, status: 500 }],
    ['HTTP 429', { body: { error: true, reason: 'Too many requests' }, status: 429 }],
    ['falha de rede', 'network-error'],
  ] as const)('comunica %s na previsão como erro, não como vazio, e recupera com retry', async (_label, failure) => {
    const fetchMock = stubFetch([failure]);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(screen.getByLabelText('Temperatura: 20 °C')).toBeVisible();
    expect(forecastCalls(fetchMock)).toHaveLength(2);
    expect(forecastCalls(fetchMock)[1][0]).toBe(forecastCalls(fetchMock)[0][0]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('move o foco para o conteúdo principal ao buscar e anuncia loading e sucesso', async () => {
    stubFetch([]);
    const user = userEvent.setup();
    render(<App />);
    const main = screen.getByRole('main');
    const announcer = screen.getByRole('status');

    expect(announcer).not.toHaveTextContent(/./);
    expect(main).not.toContainElement(announcer);

    await searchSaoPaulo(user);

    expect(main).toHaveFocus();
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(announcer).toHaveTextContent('Clima de São Paulo carregado.');
  });

  it('anuncia o loading na região viva fora do main ocupado', async () => {
    stubFetch(['hang']);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
  });

  it('mantém o foco no conteúdo principal ao tentar novamente', async () => {
    stubFetch(['network-error']);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    expect(screen.getByRole('main')).toHaveFocus();
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
  });

  it('mantém erro e retry disponíveis quando a nova tentativa também falha', async () => {
    stubFetch(['network-error', { body: {}, status: 503 }]);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a previsão do tempo. Não foi possível conectar ao serviço de clima.',
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O serviço de clima está temporariamente indisponível.',
    );
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('simula rede offline: comunica falta de conexão e recupera ao reconectar com retry', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível buscar a cidade. Você está sem conexão com a internet. Reconecte-se e tente novamente.',
    );
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');

    // Retry ainda offline mantém o erro e a ação disponíveis (AC-05.4).
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('sem conexão');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    onLine.mockReturnValue(true);
    stubFetch([]);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
    onLine.mockRestore();
  });

  it('encerra o loading com erro de timeout após 10 segundos (AC-05.5)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubFetch(['hang']);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    await searchSaoPaulo(user);
    expect(await screen.findByText('Carregando...')).toBeVisible();

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a previsão do tempo. O serviço de clima não respondeu em 10 segundos.',
    );
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  it('exibe resposta parcial com campos e dias ausentes como Indisponível (AC-02.4/03.5)', async () => {
    stubFetch([
      {
        body: {
          ...forecast,
          current: {
            time: '2026-01-10T12:00',
            temperature_2m: 20,
            weather_code: null,
            relative_humidity_2m: 0,
            wind_speed_10m: 'NaN',
          },
          daily: {
            time: ['2026-01-10', '2026-01-11', '2026-01-13'],
            weather_code: [0, 1, 3],
            temperature_2m_max: [25, null, 28],
            temperature_2m_min: [15, 16, 18],
          },
        },
      },
    ]);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    const hero = await screen.findByRole('region', { name: 'São Paulo' });
    expect(within(hero).getByLabelText('Temperatura: 20 °C')).toBeVisible();
    expect(within(hero).getByText('0 %')).toBeVisible();
    // condição, vento, precipitação e pressão ausentes/inválidos
    expect(within(hero).getAllByText('Indisponível')).toHaveLength(4);

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getByText('25 °C')).toBeVisible();
    expect(within(cards[1]).getByText('16 °C')).toBeVisible();
    expect(within(cards[1]).getAllByText('Indisponível')).toHaveLength(2);
    // 12/01 ausente na fonte: data mantida, nenhum valor inventado nem deslocado
    expect(within(cards[2]).getByText('12/01')).toBeVisible();
    expect(within(cards[2]).getAllByText('Indisponível')).toHaveLength(4);
    expect(within(cards[3]).getByText('28 °C')).toBeVisible();
    expect(within(cards[4]).getAllByText('Indisponível')).toHaveLength(4);
  });

  it('converte para Fahrenheit somente os valores disponíveis da resposta parcial', async () => {
    stubFetch([
      {
        body: {
          current: { time: '2026-01-10T12:00', temperature_2m: -17.8 },
          daily: { time: ['2026-01-10'], temperature_2m_max: [-27.5], temperature_2m_min: [null] },
        },
      },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await searchSaoPaulo(user);
    await screen.findByRole('heading', { name: 'São Paulo' });

    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));

    expect(screen.getByLabelText('Temperatura: 0 °F')).toBeVisible();
    const [today] = screen.getAllByRole('listitem');
    expect(within(today).getByText('-18 °F')).toBeVisible();
    expect(within(today).queryByText(/NaN|-0 °F/)).not.toBeInTheDocument();
  });

  it.each([
    ['sem nenhum valor meteorológico válido', { current: { time: '2026-01-10T12:00' }, daily: {} }],
    ['sem bloco daily', { current: forecast.current }],
    ['corpo nulo', null],
  ])('trata resposta %s como falha com retry, sem exibir dados', async (_label, body) => {
    stubFetch([{ body }]);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByText('Indisponível')).not.toBeInTheDocument();
  });

  it('comunica falha do geocoding sem apresentar como cidade não encontrada (AC-05.2)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ error: true, reason: 'boom' }, 500))
      .mockResolvedValueOnce(json(geocoding))
      .mockResolvedValueOnce(json(forecast));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await searchSaoPaulo(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível buscar a cidade. O serviço de clima está temporariamente indisponível.',
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('boom');
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(fetchMock.mock.calls[1][0]).toBe(fetchMock.mock.calls[0][0]);
  });
});
