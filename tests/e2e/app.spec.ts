import { expect, test } from '@playwright/test';

test('mantém layout e controles acessíveis a partir de 320 px', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());

  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'WeatherView' })).toBeVisible();
    await expect(page.getByRole('listitem')).toHaveCount(5);

    for (const control of [
      page.getByRole('searchbox'),
      page.getByRole('button', { name: 'Buscar', exact: true }),
      page.getByRole('group', { name: 'Unidade de temperatura' }),
      page.getByRole('combobox'),
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

    await page.getByRole('button', { name: '°F', exact: true }).click();
    await expect(page.getByLabel('Temperatura: 76 °F')).toBeVisible();
    await page.getByRole('combobox').selectOption('idle');
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    await expect(page.getByLabel('Temperatura: 76 °F')).toBeVisible();
  }

  expect(errors).toEqual([]);
});
