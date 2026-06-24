/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  store/useSettings.jsx — Preferencias de la app (persistidas en localStorage)
 * ─────────────────────────────────────────────────────────────────────────────
 *  A diferencia de useStore (datos del negocio en Turso), las preferencias se
 *  guardan solo en el navegador. Son por dispositivo, no por usuario.
 *
 *  Incluye: empresa, logo, moneda, zona horaria, WhatsApp del negocio,
 *  plantillas de recordatorios y parámetros de mora (graceDays / lateFeePerDay).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "prestamito_settings";

const DEFAULTS = {
  companyName: "Prestamito",
  companyLogo: "",          // base64 data URL
  currency: "ARS",          // "ARS" | "USD"
  timezone: "America/Argentina/Buenos_Aires",
  whatsapp: "",
  lateFeePerDay: 0,         // recargo fijo $ por día de atraso (luego de los días de gracia)
  graceDays: 0,             // días de gracia antes de aplicar el recargo
  reminderWhatsapp:
    "Hola {NOMBRE}, te recuerdo que {ESTADO} tu cuota #{CUOTA} por un monto de {MONTO} (vence el {FECHA}). Por favor coordina el pago a la brevedad. ¡Gracias! — {EMPRESA}",
  reminderEmailSubject: "Recordatorio de pago — Cuota #{CUOTA}",
  reminderEmailBody:
    "Hola {NOMBRE},\n\nTe recordamos que {ESTADO} tu cuota #{CUOTA} por un monto de {MONTO}, con vencimiento el {FECHA}.\n\nPor favor coordina el pago a la brevedad.\n\nSaludos,\n{EMPRESA}",
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  const save = (partial) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, save }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
