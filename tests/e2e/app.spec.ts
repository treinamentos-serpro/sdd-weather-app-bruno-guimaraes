import { expect, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weather';

test('mantém layout e controles acessíveis a partir de 320 px', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            ...mockWeatherData.city,
            admin1: mockWeatherData.city.region,
          },
        ],
      },
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        timezone: mockWeatherData.timeZone,
        utc_offset_seconds: mockWeatherData.utcOffsetSeconds,
        current: {
          time: mockWeatherData.current.sourceLocalTime,
          temperature_2m: mockWeatherData.current.temperatureCelsius,
          weather_code: mockWeatherData.current.weatherCode,
        },
        daily: {
          time: mockWeatherData.forecast.map((day) => day.localDate),
          weather_code: mockWeatherData.forecast.map((day) => day.weatherCode),
          temperature_2m_max: mockWeatherData.forecast.map((day) => day.maximumCelsius),
          temperature_2m_min: mockWeatherData.forecast.map((day) => day.minimumCelsius),
        },
      },
    }),
  );

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'WeatherView' })).toBeVisible();
    await expect(page.getByText('Consulte o clima de uma cidade')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(0);

    for (const control of [
      page.getByRole('searchbox'),
      page.getByRole('button', { name: 'Buscar', exact: true }),
      page.getByRole('group', { name: 'Unidade de temperatura' }),
    ]) {
      await expect(control).toBeVisible();
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    await page.getByRole('button', { name: 'Graus Fahrenheit' }).click();
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    await expect(page.getByLabel('Temperatura: 76 °F')).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }

  expect(errors).toEqual([]);
});
