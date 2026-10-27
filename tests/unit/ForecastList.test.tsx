import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('ForecastList', () => {
  it('apresenta os cinco dias em ordem no grid responsivo solicitado', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
    expect(screen.getByRole('list')).toHaveClass(
      'grid',
      'grid-cols-2',
      'sm:grid-cols-3',
      'lg:grid-cols-5',
    );
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(5);
    const labels = ['Hoje', 'Amanhã', 'quinta-feira', 'sexta-feira', 'sábado'];
    cards.forEach((card, index) => {
      expect(within(card).getByRole('heading', { name: labels[index] })).toBeVisible();
      expect(within(card).getByText(`${27 + index}/10`)).toHaveAttribute(
        'dateTime',
        mockWeatherData.forecast[index].localDate,
      );
    });
  });

  it('propaga a unidade a todos os cards, mantendo datas e dias incompletos', () => {
    const forecast = mockWeatherData.forecast.map((day) => ({
      ...day,
      minimumCelsius: 0,
      maximumCelsius: null,
    }));
    const { rerender } = render(<ForecastList forecast={forecast} unit="celsius" />);
    expect(screen.getAllByText('0 °C')).toHaveLength(5);

    rerender(<ForecastList forecast={forecast} unit="fahrenheit" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByText('32 °F')).toHaveLength(5);
    expect(screen.getAllByText('Indisponível')).toHaveLength(5);
    expect(screen.getByText('27/10')).toBeVisible();
  });

  it('comunica previsão indisponível para lista vazia', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Previsão indisponível.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
