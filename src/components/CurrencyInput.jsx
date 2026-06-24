/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/CurrencyInput.jsx — Input numérico con formateo de moneda en vivo
 * ─────────────────────────────────────────────────────────────────────────────
 *  Mientras el usuario tipea, se reformatea para mostrar separador de miles
 *  según el locale (punto en ARS, coma en USD). Hacia afuera siempre entrega
 *  un Number plano vía onChange(numeric, display).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect } from "react";
import { processCurrencyInput, formatInputDisplay } from "../lib/currency.js";
import { useSettings } from "../store/useSettings.jsx";

/**
 * A text input that auto-formats with thousand separators as the user types,
 * following the locale of the configured currency (ARS → dots, USD → commas).
 *
 * Props:
 *   value       {string|number}  – raw numeric value (unformatted)
 *   onChange    {(numericValue: number|null, displayValue: string) => void}
 *   placeholder {string}
 *   className   {string}
 *   disabled    {boolean}
 *   autoFocus   {boolean}
 */
export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  className = "",
  disabled,
  autoFocus,
}) {
  const { settings } = useSettings();
  const currency = settings.currency ?? "ARS";

  // Internal display string
  const [display, setDisplay] = useState(() =>
    value !== "" && value !== null && value !== undefined
      ? formatInputDisplay(value, currency)
      : ""
  );

  // Sync if external value changes (e.g. "suggest" buttons set numeric directly)
  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      setDisplay("");
    } else {
      setDisplay(formatInputDisplay(value, currency));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, currency]);

  function handleChange(e) {
    const { display: newDisplay, numeric } = processCurrencyInput(
      e.target.value,
      currency
    );
    setDisplay(newDisplay);
    onChange(numeric, newDisplay);
  }

  const symbol = currency === "ARS" ? "$" : "US$";
  const sep = currency === "ARS" ? "." : ",";
  const ph = placeholder ?? `Ej: 50${sep}000`;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none pointer-events-none">
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={ph}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`pl-8 ${className}`}
      />
    </div>
  );
}
