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
