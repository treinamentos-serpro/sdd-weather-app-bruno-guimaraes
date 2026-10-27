import { test as base, expect, type Locator, type Page } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const EXPECTED_BLOCKED_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

/**
 * Bloqueia toda requisição externa que não tenha mock próprio no teste.
 * Como o Playwright prioriza a rota registrada por último, os `page.route`
 * feitos dentro de cada teste continuam valendo; esta rota é só o fallback.
 * Requisições inesperadas fazem o teste falhar, evitando dependência silenciosa
 * da rede real.
 */
export const test = base.extend<{ blockExternalRequests: undefined }>({
  blockExternalRequests: [
    async ({ page }, use) => {
      const unexpected: string[] = [];
      await page.route(
        (url) => !LOCAL_HOSTS.has(url.hostname),
        (route) => {
          const url = new URL(route.request().url());
          if (!EXPECTED_BLOCKED_HOSTS.has(url.hostname)) unexpected.push(url.href);
          return route.abort('blockedbyclient');
        },
      );

      await use(undefined);

      expect(unexpected, 'Requisições externas sem mock').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), {
      message: 'A página não deve ter rolagem horizontal',
    })
    .toBe(true);
}

export async function expectWithinViewportWidth(locator: Locator, width: number) {
  await expect
    .poll(
      async () => {
        const bounds = await locator.boundingBox();
        return bounds !== null && bounds.x >= 0 && bounds.x + bounds.width <= width;
      },
      { message: `O controle deve caber em ${width} px de largura` },
    )
    .toBe(true);
}
