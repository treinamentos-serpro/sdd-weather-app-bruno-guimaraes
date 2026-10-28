import type { Page, Route } from '@playwright/test';
import { expect, expectNoHorizontalOverflow, test } from './fixtures';

const geocodingResponse = {
  results: [
    {
      id: 3448439,
      name: 'São Paulo',
      latitude: -23.5475,
      longitude: -46.63611,
      country: 'Brasil',
      admin1: 'São Paulo',
    },
  ],
};

const forecastResponse = {
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

async function mockOpenMeteo(page: Page) {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocodingResponse }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecastResponse }),
  );
}

async function chooseCity(page: Page, name = 'São Paulo') {
  await page.getByRole('button', { name: new RegExp(name) }).click();
}

test.describe('Weather App — fluxo de busca', () => {
  test.beforeEach(async ({ page }) => {
    await mockOpenMeteo(page);
    await page.goto('/');
  });

  test('busca cidade, exibe previsão de 5 dias e converte para °F', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeFocused();
    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();

    const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('listitem')).toHaveCount(5);
    await expect(forecast.getByText('25 °C')).toBeVisible();

    const fahrenheit = page.getByRole('button', { name: 'Graus Fahrenheit' });
    await fahrenheit.click();

    await expect(fahrenheit).toBeFocused();
    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Temperatura: 68 °F')).toBeVisible();
    await expect(forecast.getByText('77 °F')).toBeVisible();
    await expect(forecast.getByText('59 °F')).toBeVisible();
  });

  test('remove hover durante loading e preserva o foco escolhido antes da resposta', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Hover depende de um dispositivo com ponteiro.');
    let releaseForecast!: () => void;
    const pendingForecast = new Promise<void>((resolve) => {
      releaseForecast = resolve;
    });
    await page.route('https://api.open-meteo.com/**', async (route) => {
      await pendingForecast;
      await route.fulfill({ json: forecastResponse });
    });
    const search = page.getByRole('button', { name: 'Buscar', exact: true });
    const main = page.getByRole('main');
    await page.getByRole('searchbox').fill('São Paulo');
    const background = await search.evaluate((button) => getComputedStyle(button).backgroundColor);
    await search.hover();
    await expect(search).not.toHaveCSS('background-color', background);

    try {
      await search.click();
      await chooseCity(page);
      await expect(main).toHaveAttribute('aria-busy', 'true');
      await expect(main).toBeFocused();
      await expect(search).toBeDisabled();
      await expect(search).toHaveCSS('background-color', background);
      await page.getByRole('button', { name: 'Graus Fahrenheit' }).click();
    } finally {
      releaseForecast();
    }

    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    await expect(main).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByRole('button', { name: 'Graus Fahrenheit' })).toBeFocused();
    await expect(page.getByLabel('Temperatura: 68 °F')).toBeVisible();
  });
});

test.describe('Weather App — cidade não encontrada', () => {
  test('exibe "Nenhuma cidade encontrada" quando o geocoding retorna {}', async ({ page }) => {
    let forecastRequested = false;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: {} }),
    );
    await page.route('https://api.open-meteo.com/**', (route) => {
      forecastRequested = true;
      return route.fulfill({ json: forecastResponse });
    });
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('Cidadeinexistente');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Nenhuma cidade encontrada.');
    await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
    expect(forecastRequested).toBe(false);
  });
});

test.describe('Weather App — edge cases da spec', () => {
  test('descarta respostas de geocoding antigas quando uma nova busca termina primeiro (AC-01.7)', async ({
    page,
  }) => {
    let releaseOldSearch!: () => void;
    let finishOldResponse!: () => void;
    const oldSearch = new Promise<void>((resolve) => {
      releaseOldSearch = resolve;
    });
    const oldResponseFinished = new Promise<void>((resolve) => {
      finishOldResponse = resolve;
    });
    let geocodingCalls = 0;
    await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
      geocodingCalls += 1;
      const query = new URL(route.request().url()).searchParams.get('name');
      if (query === 'Cidade antiga') {
        await oldSearch;
        await route.fulfill({
          json: {
            results: [
              {
                id: 1,
                name: 'Cidade antiga',
                latitude: 0,
                longitude: 0,
                country: 'Brasil',
              },
            ],
          },
        });
        finishOldResponse();
        return;
      }
      await route.fulfill({
        json: {
          results: [
            {
              id: 2,
              name: 'Lisboa',
              latitude: 38.72,
              longitude: -9.14,
              country: 'Portugal',
              admin1: 'Lisboa',
            },
          ],
        },
      });
    });
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({ json: forecastResponse }),
    );
    await page.goto('/');
    const searchbox = page.getByRole('searchbox', { name: 'Cidade' });
    await searchbox.fill('Cidade antiga');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(searchbox).toBeEnabled();

    await searchbox.fill('Lisboa');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('button', { name: /Lisboa/ }).click();
    await expect(page.getByRole('heading', { name: 'Lisboa', exact: true })).toBeVisible();

    releaseOldSearch();
    await oldResponseFinished;
    await expect(page.getByRole('heading', { name: 'Lisboa', exact: true })).toBeVisible();
    expect(geocodingCalls).toBe(2);
    await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  });

  test('seleciona homônimas por teclado e descarta clima obsoleto (AC-01.1/01.2/01.2a/01.3/06.4/06.5)', async ({
    page,
  }) => {
    const results = {
      results: [
        {
          id: 1,
          name: 'Springfield',
          latitude: 39.799,
          longitude: -89.644,
          country: 'United States',
          admin1: 'Illinois',
        },
        {
          id: 2,
          name: 'Springfield',
          latitude: 42.101,
          longitude: -72.589,
          country: 'United States',
          admin1: 'Illinois',
        },
      ],
    };
    let forecastCalls = 0;
    let releaseFirstForecast!: () => void;
    const firstForecast = new Promise<void>((resolve) => {
      releaseFirstForecast = resolve;
    });
    const requestedCoordinates: string[] = [];

    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: results }),
    );
    await page.route('https://api.open-meteo.com/**', async (route) => {
      forecastCalls += 1;
      const requestUrl = new URL(route.request().url());
      requestedCoordinates.push(
        `${requestUrl.searchParams.get('latitude')},${requestUrl.searchParams.get('longitude')}`,
      );
      if (forecastCalls === 1) {
        await firstForecast;
        await route.fulfill({ json: forecastResponse });
        return;
      }
      await route.fulfill({
        json: {
          ...forecastResponse,
          current: { ...forecastResponse.current, temperature_2m: 30 },
        },
      });
    });
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('Springfield');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    const options = page.getByRole('list', { name: 'Resultados da busca' }).getByRole('button');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toContainText('Coordenadas: 39,799, -89,644');
    await expect(options.nth(1)).toContainText('Coordenadas: 42,101, -72,589');
    await options.nth(0).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => forecastCalls).toBe(1);
    await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    await options.nth(1).click();

    await expect(page.getByLabel('Temperatura: 30 °C')).toBeVisible();
    releaseFirstForecast();
    await expect.poll(() => forecastCalls).toBe(2);
    await expect(page.getByLabel('Temperatura: 30 °C')).toBeVisible();
    expect(requestedCoordinates).toEqual(['39.799,-89.644', '42.101,-72.589']);
  });

  test('não envia busca vazia ou só com espaços e mantém o campo corrigível (AC-01.5)', async ({
    page,
  }) => {
    const geocodingUrls: string[] = [];
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      geocodingUrls.push(route.request().url());
      return route.fulfill({ json: geocodingResponse });
    });
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({ json: forecastResponse }),
    );
    await page.goto('/');
    const searchbox = page.getByRole('searchbox', { name: 'Cidade' });

    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Digite o nome de uma cidade para buscar.');
    await expect(searchbox).toBeFocused();
    await expect(searchbox).toHaveAttribute('aria-invalid', 'true');

    await searchbox.fill('   ');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await searchbox.press('Enter');
    await expect(page.getByRole('alert')).toHaveText('Digite o nome de uma cidade para buscar.');
    await expect(searchbox).toBeEditable();
    expect(geocodingUrls).toEqual([]);

    await searchbox.fill('São Paulo');
    await searchbox.press('Enter');
    await chooseCity(page);
    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
    expect(geocodingUrls).toHaveLength(1);
  });

  test('envia caracteres especiais codificados, sem espaços externos (AC-01.6)', async ({
    page,
  }) => {
    const query = "Sant'Ana & Côte-d’Or #2/3 + 100% ?count=99";
    let requestedUrl: URL | undefined;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      requestedUrl = new URL(route.request().url());
      return route.fulfill({ json: geocodingResponse });
    });
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({ json: forecastResponse }),
    );
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill(`  ${query}  `);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
    expect(requestedUrl?.searchParams.getAll('name')).toEqual([query]);
    expect(requestedUrl?.searchParams.getAll('count')).toEqual(['10']);
    expect(requestedUrl?.hash).toBe('');
  });

  for (const body of [{}, { results: [] }]) {
    test(`geocoding sem resultados (${JSON.stringify(body)}) é estado vazio e permite nova busca (AC-01.4)`, async ({
      page,
    }) => {
      let geocodingCalls = 0;
      await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
        geocodingCalls += 1;
        return route.fulfill({ json: geocodingCalls === 1 ? body : geocodingResponse });
      });
      await page.route('https://api.open-meteo.com/**', (route) =>
        route.fulfill({ json: forecastResponse }),
      );
      await page.goto('/');
      const searchbox = page.getByRole('searchbox', { name: 'Cidade' });

      await searchbox.fill('Cidadeinexistente');
      await searchbox.press('Enter');

      await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0);
      await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
      await expect(searchbox).toBeEditable();

      await searchbox.fill('São Paulo');
      await searchbox.press('Enter');
      await chooseCity(page);
      await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
      await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);
    });
  }

  test('previsão sem dados diários mantém cinco dias marcados como Indisponível (AC-03.5)', async ({
    page,
  }) => {
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: geocodingResponse }),
    );
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({ json: { ...forecastResponse, daily: {} } }),
    );
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();
    const cards = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem');
    await expect(cards).toHaveCount(5);
    for (const [index, date] of ['10/01', '11/01', '12/01', '13/01', '14/01'].entries()) {
      await expect(cards.nth(index).getByText(date)).toBeVisible();
      await expect(cards.nth(index).getByText('Indisponível')).toHaveCount(4);
      await expect(cards.nth(index).getByText(/°C/)).toHaveCount(0);
    }
  });

  test('previsão sem nenhum dado válido é falha com retry, sem valores (AC-05.6)', async ({
    page,
  }) => {
    let forecastCalls = 0;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: geocodingResponse }),
    );
    await page.route('https://api.open-meteo.com/**', (route) => {
      forecastCalls += 1;
      return route.fulfill({
        json:
          forecastCalls === 1
            ? { current: { time: '2026-01-10T12:00' }, daily: {} }
            : forecastResponse,
      });
    });
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('alert')).toContainText(
      'Os dados recebidos estão incompletos ou em formato inesperado.',
    );
    await expect(page.getByText('Indisponível')).toHaveCount(0);
    await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);

    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();
    expect(forecastCalls).toBe(2);
  });
});

test.describe('Weather App — viewport mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await mockOpenMeteo(page);
    await page.goto('/');
  });

  test('busca cidade e renderiza o clima corretamente', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();

    const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('listitem')).toHaveCount(5);

    await expectNoHorizontalOverflow(page);
  });
});

test.describe('Weather App — falha da API e resposta parcial', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
      route.fulfill({ json: geocodingResponse }),
    );
  });

  test('exibe erro com retry quando a previsão falha e recupera na nova tentativa', async ({
    page,
  }) => {
    let forecastCalls = 0;
    await page.route('https://api.open-meteo.com/**', (route) => {
      forecastCalls += 1;
      return forecastCalls === 1
        ? route.fulfill({ status: 503, json: { error: true, reason: 'Service unavailable' } })
        : route.fulfill({ json: forecastResponse });
    });
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('alert')).toContainText(
      'O serviço de clima está temporariamente indisponível.',
    );
    await expect(page.getByRole('alert')).not.toContainText('503');
    await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(forecastCalls).toBe(2);
  });

  test('comunica falha de rede na previsão sem exibir dados', async ({ page }) => {
    await page.route('https://api.open-meteo.com/**', (route) => route.abort('failed'));
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível conectar ao serviço de clima.',
    );
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toHaveCount(0);
  });

  test('simula o navegador offline e recupera com retry ao reconectar', async ({
    page,
    context,
  }) => {
    // Mocks de `page.route` respondem mesmo com o contexto offline; por isso as
    // rotas abortam como o navegador faria enquanto `offline` estiver ativo.
    let offline = false;
    const respond = (json: unknown) => (route: Route) =>
      offline ? route.abort('internetdisconnected') : route.fulfill({ json });
    await page.route('https://geocoding-api.open-meteo.com/**', respond(geocodingResponse));
    await page.route('https://api.open-meteo.com/**', respond(forecastResponse));
    await page.goto('/');
    offline = true;
    await context.setOffline(true);

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(page.getByRole('alert')).toContainText('Você está sem conexão com a internet.');
    await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);

    offline = false;
    await context.setOffline(false);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await chooseCity(page);

    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('mantém os cinco dias e marca dados ausentes como Indisponível', async ({ page }) => {
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({
        json: {
          ...forecastResponse,
          current: { time: '2026-01-10T12:00', temperature_2m: 20 },
          daily: {
            time: ['2026-01-10', '2026-01-11'],
            weather_code: [0, 1],
            temperature_2m_max: [25, null],
            temperature_2m_min: [15, 16],
          },
        },
      }),
    );
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await chooseCity(page);

    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();
    const cards = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('listitem');
    await expect(cards).toHaveCount(5);
    await expect(cards.nth(0).getByText('25 °C')).toBeVisible();
    await expect(cards.nth(1).getByText('Indisponível')).toHaveCount(2);
    await expect(cards.nth(4).getByText('14/01')).toBeVisible();
    await expect(cards.nth(4).getByText('Indisponível')).toHaveCount(4);
  });
});
