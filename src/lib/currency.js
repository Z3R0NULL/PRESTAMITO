/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  lib/currency.js — Utilidades de moneda
 * ─────────────────────────────────────────────────────────────────────────────
 *  Tres funciones principales:
 *    • formatCurrency(n, cur)        → "$ 1.500,50" listo para mostrar.
 *    • formatInputDisplay(n, cur)    → "1.500,50" sin símbolo, para inputs.
 *    • parseInputValue(str, cur)     → convierte texto local a Number.
 *    • processCurrencyInput(str,cur) → procesa cada tecleo en un input.
 *
 *  Locales soportados:
 *    Argentina (ARS):  1.000,50   (punto = miles, coma = decimal)
 *    USD:              1,000.50   (coma = miles, punto = decimal)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Format a number for display (with currency symbol).
 * @param {number} value
 * @param {"ARS"|"USD"} currency
 */
export function formatCurrency(value, currency = "ARS") {
  const locale = currency === "ARS" ? "es-AR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

/**
 * Format a raw number as a thousands-separated string for display inside inputs.
 * Uses the locale convention (ARS → dot as thousands, USD → comma as thousands).
 * No currency symbol, no decimal part unless present.
 *
 * @param {string|number} raw  – the stored numeric value
 * @param {"ARS"|"USD"} currency
 * @returns {string}
 */
export function formatInputDisplay(raw, currency = "ARS") {
  const n = typeof raw === "string" ? parseInputValue(raw, currency) : raw;
  if (n === null || isNaN(n)) return raw ?? "";
  const locale = currency === "ARS" ? "es-AR" : "en-US";
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(n);
}

/**
 * Parse a locale-formatted input string into a JS number.
 * ARS:  "50.000"  → 50000,   "1.500,75" → 1500.75
 * USD:  "50,000"  → 50000,   "1,500.75" → 1500.75
 *
 * @param {string} str
 * @param {"ARS"|"USD"} currency
 * @returns {number|null}
 */
export function parseInputValue(str, currency = "ARS") {
  if (str === "" || str === null || str === undefined) return null;
  const s = String(str).trim();
  if (s === "") return null;

  let normalized;
  if (currency === "ARS") {
    // ARS: dot=thousands, comma=decimal
    // Remove thousand dots, replace decimal comma with dot
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    // USD: comma=thousands, dot=decimal
    normalized = s.replace(/,/g, "");
  }

  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

/**
 * Given a keystroke on a currency input, return the cleaned display string.
 * Strips non-numeric chars (except locale decimal separator), re-formats thousands.
 *
 * @param {string} inputStr  – raw value from the <input> event
 * @param {"ARS"|"USD"} currency
 * @returns {{ display: string, numeric: number|null }}
 */
export function processCurrencyInput(inputStr, currency = "ARS") {
  const decimalSep = currency === "ARS" ? "," : ".";
  const thousandSep = currency === "ARS" ? "." : ",";

  // Allow only digits and one decimal separator
  // First strip everything except digits and the decimal separator
  let raw = String(inputStr ?? "");

  // Remove all chars that are not digits or decimal separator
  const allowed = new RegExp(`[^0-9${escapeRegex(decimalSep)}]`, "g");
  raw = raw.replace(allowed, "");

  // Keep only first decimal separator
  const parts = raw.split(decimalSep);
  const intPart = parts[0] ?? "";
  const decPart = parts.length > 1 ? parts.slice(1).join("") : null;

  // Format integer part with thousands separator
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  let display;
  if (decPart !== null) {
    // User typed decimal sep — keep it even if decPart is empty (they're typing)
    display = intFormatted + decimalSep + decPart;
  } else {
    display = intFormatted;
  }

  // Compute numeric value
  const numeric = parseInputValue(display, currency);

  return { display, numeric };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
