import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weather';
import type { Unit } from '../../src/types/weather';

afterEach(cleanup);

const current = { ...mockWeatherData.current, temperatureCelsius: 0 };

function WeatherWithToggle() {
  const [unit, setUnit] = useState<Unit>('celsius');
  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
    </>
  );
}

describe('Conversão de unidade (UnitToggle + CurrentWeather)', () => {
  it('exibe 32 °F ao trocar para Fahrenheit com temperatura de 0 °C', async () => {
    const user = userEvent.setup();
    render(<WeatherWithToggle />);

    expect(screen.getByLabelText('Temperatura: 0 °C')).toHaveTextContent('0 °C');

    const fahrenheit = screen.getByRole('button', { name: 'Graus Fahrenheit' });
    await user.click(fahrenheit);

    expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Temperatura: 32 °F')).toHaveTextContent('32 °F');
    expect(screen.queryByLabelText('Temperatura: 0 °C')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Graus Celsius' }));

    expect(screen.getByLabelText('Temperatura: 0 °C')).toBeInTheDocument();
  });
});
