import { type FormEvent, useId, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [city, setCity] = useState('');
  const [showError, setShowError] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const query = city.trim();
    if (!query) {
      setShowError(true);
      inputRef.current?.focus();
      return;
    }

    setShowError(false);
    onSearch(query);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          name="city"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setShowError(false);
          }}
          disabled={disabled}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : undefined}
          placeholder="Digite o nome de uma cidade"
          className={`min-w-0 flex-1 rounded-xl border bg-night-900 px-4 py-3 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            showError ? 'border-rose-300' : 'border-white/40'
          }`}
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {showError && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-rose-200">
          Digite o nome de uma cidade para buscar.
        </p>
      )}
    </form>
  );
}
