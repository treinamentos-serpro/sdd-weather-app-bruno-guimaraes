import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('compõe marca, busca, unidade e dados mock em Celsius inicialmente', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'WeatherView', level: 1 })).toBeVisible();
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Estado da demonstração' })).toHaveValue('success');
    expect(screen.getByRole('complementary')).toHaveTextContent('dados fictícios e fixos');
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it.each([
    ['idle', 'Consulte o clima de uma cidade'],
    ['loading', 'Carregando...'],
    ['empty', 'Nenhuma cidade encontrada'],
    ['error', 'Não foi possível obter os dados meteorológicos.'],
  ])('alterna para %s sem manter resultados visíveis', async (status, message) => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByRole('combobox'), status);

    expect(screen.getByText(message)).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', String(status === 'loading'));

    await user.selectOptions(screen.getByRole('combobox'), 'success');
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  });

  it('bloqueia a busca durante loading, mantendo seletor e unidade disponíveis', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox'), 'loading');

    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));
    await user.selectOptions(screen.getByRole('combobox'), 'success');

    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();
  });

  it('retorna ao mock em buscas válidas e no retry sem consultar a rede', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox'), 'idle');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade');
    expect(screen.getByRole('combobox')).toHaveValue('idle');

    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();

    await user.selectOptions(screen.getByRole('combobox'), 'error');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('converte temperaturas atuais e dos cinco dias sem mutar o mock ou perder a unidade', async () => {
    const original = structuredClone(mockWeatherData);
    const user = userEvent.setup();
    render(<App />);
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

    await user.selectOptions(screen.getByRole('combobox'), 'empty');
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();

    await user.selectOptions(screen.getByRole('combobox'), 'error');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByLabelText('Temperatura: 76 °F')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Graus Celsius' }));
    expect(screen.getByLabelText('Temperatura: 25 °C')).toBeVisible();
    expect(screen.getByText('28 °C')).toBeVisible();
    expect(mockWeatherData).toEqual(original);
  });
});
