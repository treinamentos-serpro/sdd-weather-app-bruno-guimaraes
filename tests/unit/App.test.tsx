import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  searchCities: vi.fn(),
  getWeather: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchCities).mockResolvedValue([mockWeatherData.city]);
  vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
});

afterEach(cleanup);

describe('App', () => {
  it('inicia em idle com busca e Celsius, sem dados ou controles de demonstração', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'WeatherView', level: 1 })).toBeVisible();
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Consulte o clima de uma cidade')).toBeVisible();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('valida consultas vazias e apresenta os dados retornados para a cidade buscada', async () => {
    const city = { ...mockWeatherData.city, name: 'Recife', latitude: -8.05, longitude: -34.88 };
    vi.mocked(searchCities).mockResolvedValue([city]);
    vi.mocked(getWeather).mockResolvedValue({ ...mockWeatherData, city });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade');
    expect(searchCities).not.toHaveBeenCalled();

    await user.type(screen.getByRole('searchbox'), '  Recife  {Enter}');
    expect(await screen.findByRole('heading', { name: 'Recife' })).toBeVisible();
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(city);
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Consulte o clima de uma cidade')).not.toBeInTheDocument();
  });

  it('bloqueia a busca durante loading, oculta dados anteriores e mantém a unidade disponível', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();

    let resolveWeather!: (data: WeatherData) => void;
    vi.mocked(getWeather).mockReturnValueOnce(
      new Promise<WeatherData>((resolve) => {
        resolveWeather = resolve;
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByText('Carregando...')).toBeVisible();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));
    await act(async () => resolveWeather(mockWeatherData));

    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it('apresenta empty sem resultados anteriores e permite uma nova busca', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('list')).toBeVisible();

    vi.mocked(searchCities).mockResolvedValueOnce([]);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Cidade inexistente{Enter}');

    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeVisible();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledTimes(1);

    await user.type(screen.getByRole('searchbox'), '{Enter}');
    expect(await screen.findByRole('list')).toBeVisible();
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
  });

  it.each([
    'search',
    'weather',
  ] as const)('exibe o erro de %s e repete somente a operação que falhou ao tentar novamente', async (operation) => {
    if (operation === 'search') {
      vi.mocked(searchCities).mockRejectedValueOnce(new Error('Falha ao buscar cidades.'));
    } else {
      vi.mocked(getWeather).mockRejectedValueOnce(new Error('Falha ao consultar previsão.'));
    }
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      operation === 'search' ? 'Falha ao buscar cidades.' : 'Falha ao consultar previsão.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(operation === 'search' ? 0 : 1);
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'Outro nome');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByLabelText('Temperatura: 76 °F')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(operation === 'search' ? 2 : 1);
    expect(searchCities).toHaveBeenLastCalledWith('São Paulo');
    expect(getWeather).toHaveBeenCalledTimes(operation === 'search' ? 1 : 2);
    expect(getWeather).toHaveBeenLastCalledWith(mockWeatherData.city);
  });

  it('converte temperaturas atuais e dos cinco dias sem mutar dados ou fazer novas requisições', async () => {
    const original = structuredClone(mockWeatherData);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByLabelText('Temperatura: 25 °C')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));

    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();
    const temperatures = [
      ['82 °F', '65 °F'],
      ['85 °F', '66 °F'],
      ['80 °F', '69 °F'],
      ['74 °F', '64 °F'],
      ['78 °F', '62 °F'],
    ];
    screen.getAllByRole('listitem').forEach((card, index) => {
      for (const temperature of temperatures[index]) {
        expect(within(card).getByText(temperature)).toBeVisible();
      }
    });
    expect(screen.getByText('12,5 km/h')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Graus Celsius' }));
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(screen.getByText('28 °C')).toBeVisible();
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(mockWeatherData).toEqual(original);
  });
});
