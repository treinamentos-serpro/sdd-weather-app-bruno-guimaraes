import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

afterEach(cleanup);

describe('UnitToggle', () => {
  it('apresenta as duas unidades e indica a unidade selecionada', () => {
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    const celsius = within(group).getByRole('button', { name: 'Graus Celsius' });
    const fahrenheit = within(group).getByRole('button', { name: 'Graus Fahrenheit' });

    expect(celsius).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'false');
  });

  it('permite alcançar as duas unidades com Tab', async () => {
    const user = userEvent.setup();
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Graus Celsius' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Graus Fahrenheit' })).toHaveFocus();
  });

  it('notifica a nova unidade ao selecionar uma opção', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Graus Fahrenheit' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
  });

  it.each([
    ['ArrowRight', 'Graus Fahrenheit', 'fahrenheit'],
    ['ArrowDown', 'Graus Fahrenheit', 'fahrenheit'],
    ['ArrowLeft', 'Graus Fahrenheit', 'fahrenheit'],
    ['ArrowUp', 'Graus Fahrenheit', 'fahrenheit'],
    ['End', 'Graus Fahrenheit', 'fahrenheit'],
    ['Home', 'Graus Celsius', 'celsius'],
  ])('suporta navegação por %s', async (key, focusedOption, selectedUnit) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    screen.getByRole('button', { name: 'Graus Celsius' }).focus();
    await user.keyboard(`{${key}}`);

    expect(screen.getByRole('button', { name: focusedOption })).toHaveFocus();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(selectedUnit);
  });

  it('permite ativar a opção focada com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const fahrenheit = screen.getByRole('button', { name: 'Graus Fahrenheit' });

    fahrenheit.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');
    expect(onChange).toHaveBeenNthCalledWith(2, 'fahrenheit');
  });
});
