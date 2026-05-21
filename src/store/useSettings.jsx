import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "prestamito_settings";

const DEFAULTS = {
  companyName: "Prestamito",
  companyLogo: "",          // base64 data URL
  currency: "ARS",          // "ARS" | "USD"
  timezone: "America/Argentina/Buenos_Aires",
  whatsapp: "",
  lateInterestRate: 0,      // % mensual por mora
  graceDays: 0,             // días de gracia
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
