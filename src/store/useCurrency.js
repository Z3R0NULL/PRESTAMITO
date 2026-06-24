/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  store/useCurrency.js — Hook de formateo de moneda
 * ─────────────────────────────────────────────────────────────────────────────
 *  Atajo para no tener que importar formatCurrency + useSettings en cada
 *  componente. Devuelve una función `fmt(n)` que ya conoce la moneda
 *  configurada (ARS / USD).
 *
 *  Uso típico:
 *      const fmt = useCurrency();
 *      <span>{fmt(loan.amount)}</span>   // → "$ 50.000"
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useSettings } from "./useSettings.jsx";
import { formatCurrency } from "../lib/currency.js";

/**
 * Returns a `fmt(n)` function that formats numbers using the configured currency.
 */
export function useCurrency() {
  const { settings } = useSettings();
  const currency = settings.currency ?? "ARS";
  return (n) => formatCurrency(n, currency);
}
