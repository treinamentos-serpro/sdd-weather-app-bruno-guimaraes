import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CityResults from '../../src/components/CityResults';
import type { City } from '../../src/types/weather';

afterEach(cleanup);

const cities: City[] = [
  {
    id: 1,
    name: 'Springfield',
    region: null,
    country: null,
    latitude: 39.799,
    longitude: -89.644,
  },
  {
    id: 2,
    name: 'Springfield',
    region: null,
    country: null,
    latitude: 42.101,
    longitude: -72.589,
  },
  {
    id: 3,
    name: 'Porto',
    region: 'Porto',
    country: 'Portugal',
    latitude: 41.149,
    longitude: -8.611,
  },
];

describe('CityResults', () => {
  it('preserva a ordem e exibe contexto/coordenadas desambiguadoras (AC-01.2/01.2a)', () => {
    render(<CityResults cities={cities} onSelect={vi.fn()} />);
    const results = screen.getByRole('list', { name: 'Resultados da busca' });
    const options = within(results).getAllByRole('button');

    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Springfield');
    expect(options[0]).toHaveTextContent('Coordenadas: 39,799, -89,644');
    expect(options[1]).toHaveTextContent('Coordenadas: 42,101, -72,589');
    expect(options[2]).toHaveTextContent('Porto, Portugal');
    expect(options[2]).not.toHaveTextContent('Coordenadas');
  });

  it('permite selecionar uma opção com teclado (AC-01.1)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CityResults cities={cities} onSelect={onSelect} />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(cities[0]);
  });
});
