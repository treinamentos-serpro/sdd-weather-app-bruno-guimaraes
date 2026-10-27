import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

afterEach(cleanup);

describe('SearchBar', () => {
  it('apresenta uma região de busca e um campo com label acessível', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const search = screen.getByRole('search', { name: 'Buscar cidade' });
    expect(within(search).getByRole('searchbox', { name: 'Cidade' })).toBe(
      screen.getByLabelText('Cidade'),
    );
    expect(within(search).getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it.each(['click', 'enter'])('envia a cidade apenas após %s', async (action) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), "  São João d'Aliança  ");
    expect(onSearch).not.toHaveBeenCalled();

    if (action === 'click') {
      await user.click(screen.getByRole('button', { name: 'Buscar' }));
    } else {
      await user.keyboard('{Enter}');
    }

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("São João d'Aliança");
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['', '   '])('não envia a consulta em branco %j e orienta a correção', async (city) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');
    if (city) await user.type(input, city);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite o nome de uma cidade para buscar.');
    expect(input).toHaveAccessibleDescription('Digite o nome de uma cidade para buscar.');
    expect(input).toBeInvalid();
    expect(input).toBeEnabled();

    await user.type(input, 'Recife{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toBeValid();
  });

  it('desabilita os controles e impede envio mesmo com uma cidade preenchida', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox'), 'Recife');

    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('associa cada label ao seu próprio campo quando há mais de uma barra', () => {
    render(
      <>
        <SearchBar onSearch={vi.fn()} />
        <SearchBar onSearch={vi.fn()} />
      </>,
    );

    const inputs = screen.getAllByLabelText('Cidade');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });
});
