import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';

afterEach(cleanup);

describe('UnitToggle', () => {
  it('apresenta as duas unidades e indica a unidade selecionada', () => {
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    const celsius = within(group).getByRole('button', { name: '°C' });
    const fahrenheit = within(group).getByRole('button', { name: '°F' });

    expect(celsius).toHaveAttribute('aria-pressed', 'true');
    expect(celsius).toHaveAttribute('tabindex', '0');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'false');
    expect(fahrenheit).toHaveAttribute('tabindex', '-1');
  });

  it('notifica a nova unidade ao selecionar uma opção', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
  });

  it.each([
    ['ArrowRight', '°F', 'fahrenheit'],
    ['ArrowDown', '°F', 'fahrenheit'],
    ['ArrowLeft', '°F', 'fahrenheit'],
    ['ArrowUp', '°F', 'fahrenheit'],
    ['End', '°F', 'fahrenheit'],
    ['Home', '°C', 'celsius'],
  ])('suporta navegação por %s', async (key, focusedOption, selectedUnit) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    screen.getByRole('button', { name: '°C' }).focus();
    await user.keyboard(`{${key}}`);

    expect(screen.getByRole('button', { name: focusedOption })).toHaveFocus();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(selectedUnit);
  });

  it('permite ativar a opção focada com Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const fahrenheit = screen.getByRole('button', { name: '°F' });

    fahrenheit.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');
    expect(onChange).toHaveBeenNthCalledWith(2, 'fahrenheit');
  });
});
