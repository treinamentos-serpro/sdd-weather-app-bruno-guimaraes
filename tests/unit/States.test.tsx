import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('exibe o carregamento sem região viva própria (anúncio fica no App)', () => {
    render(<LoadingState />);

    expect(screen.getByText('Carregando...')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('anuncia a mensagem recebida sem tentar novamente automaticamente', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível carregar os dados." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar os dados.');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('executa o retry uma vez por clique e mantém a ação disponível', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Serviço indisponível." onRetry={onRetry} />);
    const button = screen.getByRole('button', { name: 'Tentar novamente' });

    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Serviço indisponível.');
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it.each(['{Enter}', ' '])('permite nova tentativa pelo teclado com %s', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Serviço indisponível." onRetry={onRetry} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('não envia um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Serviço indisponível." onRetry={onRetry} />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('EmptyState', () => {
  it('exibe o título e a dica sem apresentar erro ou carregamento', () => {
    render(
      <EmptyState
        title="Nenhuma cidade encontrada"
        hint="Confira o nome da cidade e faça uma nova busca."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
    expect(screen.getByText('Confira o nome da cidade e faça uma nova busca.')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });
});
