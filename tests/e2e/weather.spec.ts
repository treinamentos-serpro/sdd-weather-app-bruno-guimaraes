import { expect, type Page, test } from '@playwright/test';

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
  // Evita dependência de rede externa (ex.: fontes) e torna o teste determinístico.
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocodingResponse }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecastResponse }),
  );
}

test.describe('Weather App — fluxo de busca', () => {
  test.beforeEach(async ({ page }) => {
    await mockOpenMeteo(page);
    await page.goto('/');
  });

  test('busca cidade, exibe previsão de 5 dias e converte para °F', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'São Paulo' })).toBeVisible();
    await expect(page.getByLabel('Temperatura: 20 °C')).toBeVisible();

    const forecast = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(forecast).toBeVisible();
    await expect(forecast.getByRole('listitem')).toHaveCount(5);
    await expect(forecast.getByText('25 °C')).toBeVisible();

    const fahrenheit = page.getByRole('button', { name: 'Graus Fahrenheit' });
    await fahrenheit.click();

    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Temperatura: 68 °F')).toBeVisible();
    await expect(forecast.getByText('77 °F')).toBeVisible();
    await expect(forecast.getByText('59 °F')).toBeVisible();
  });
});
