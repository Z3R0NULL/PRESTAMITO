/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/SettingsModal.jsx — Modal de configuración de la app
 * ─────────────────────────────────────────────────────────────────────────────
 *  Edita los valores de useSettings (empresa, logo, moneda, zona horaria,
 *  WhatsApp, parámetros de mora y plantillas de recordatorios). Los cambios
 *  se persisten en localStorage al guardar.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useRef } from "react";
import { X, Building2, Globe, Phone, AlertTriangle, Clock, Upload, Trash2, MessageCircle } from "lucide-react";
import { useSettings } from "../store/useSettings.jsx";
import { REMINDER_VARIABLES } from "./loanHelpers.jsx";

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (ART, UTC-3)" },
  { value: "America/Bogota",                 label: "Colombia (COT, UTC-5)" },
  { value: "America/Lima",                   label: "Perú (PET, UTC-5)" },
  { value: "America/Santiago",               label: "Chile (CLT, UTC-4/-3)" },
  { value: "America/Caracas",                label: "Venezuela (VET, UTC-4)" },
  { value: "America/Mexico_City",            label: "México Centro (CST, UTC-6)" },
  { value: "America/New_York",               label: "Nueva York (EST, UTC-5)" },
  { value: "UTC",                            label: "UTC" },
];

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-blue-400" />
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function InputField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const { settings, save } = useSettings();
  const fileRef = useRef(null);

  const [form, setForm] = useState({ ...settings });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setErrors((prev) => ({ ...prev, companyLogo: "La imagen no debe superar 500 KB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setErrors((prev) => ({ ...prev, companyLogo: undefined }));
      setForm((f) => ({ ...f, companyLogo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm((f) => ({ ...f, companyLogo: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    const errs = {};
    if (!form.companyName?.trim()) errs.companyName = "El nombre es requerido";
    const fee = Number(form.lateFeePerDay);
    if (isNaN(fee) || fee < 0) errs.lateFeePerDay = "Debe ser un monto ≥ 0";
    const grace = Number(form.graceDays);
    if (isNaN(grace) || grace < 0 || !Number.isInteger(grace)) errs.graceDays = "Debe ser un número entero ≥ 0";
    return errs;
  };

  const submit = () => {
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    save({
      ...form,
      lateFeePerDay: Number(form.lateFeePerDay),
      graceDays: Number(form.graceDays),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0d1224] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Configuración</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ajustes generales del negocio</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7">

          {/* ── Empresa ─────────────────────────────── */}
          <div>
            <SectionTitle icon={Building2} label="Empresa" />
            <div className="space-y-4">

              {/* Logo */}
              <InputField label="Logo de la empresa" error={errors.companyLogo}>
                <div className="flex items-center gap-3">
                  {form.companyLogo ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={form.companyLogo}
                        alt="Logo"
                        className="w-14 h-14 rounded-xl object-contain bg-slate-800 border border-slate-700"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={10} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 border-dashed flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-slate-600" />
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
                    >
                      <Upload size={12} /> Subir imagen
                    </button>
                    <p className="text-xs text-slate-600 mt-1">PNG, JPG · máx 500 KB</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </div>
                </div>
              </InputField>

              {/* Nombre */}
              <InputField label="Nombre de la empresa *" error={errors.companyName}>
                <input
                  value={form.companyName}
                  onChange={set("companyName")}
                  placeholder="Ej: Créditos García"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </InputField>

              {/* WhatsApp */}
              <InputField label="WhatsApp del negocio" error={errors.whatsapp}>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </InputField>
            </div>
          </div>

          {/* ── Región ──────────────────────────────── */}
          <div>
            <SectionTitle icon={Globe} label="Región" />
            <div className="space-y-4">

              {/* Moneda */}
              <InputField label="Moneda">
                <div className="grid grid-cols-2 gap-2">
                  {["ARS", "USD"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, currency: c }))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        form.currency === c
                          ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {c === "ARS" ? "🇦🇷 ARS" : "🇺🇸 USD"}
                    </button>
                  ))}
                </div>
              </InputField>

              {/* Zona horaria */}
              <InputField label="Zona horaria">
                <select
                  value={form.timezone}
                  onChange={set("timezone")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </InputField>
            </div>
          </div>

          {/* ── Mora ────────────────────────────────── */}
          <div>
            <SectionTitle icon={AlertTriangle} label="Política de mora" />
            <div className="grid grid-cols-2 gap-4">

              <InputField label="Recargo por día ($)" error={errors.lateFeePerDay}>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.lateFeePerDay}
                    onChange={set("lateFeePerDay")}
                    placeholder="Ej: 1000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </InputField>

              <InputField label="Días de gracia" error={errors.graceDays}>
                <div className="relative">
                  <Clock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.graceDays}
                    onChange={set("graceDays")}
                    placeholder="Ej: 5"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </InputField>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Pasados los días de gracia, se suma <strong>{`$${form.lateFeePerDay || 0}`}</strong> por cada día adicional de atraso al monto de la cuota.
            </p>
          </div>

          {/* ── Mensajes de recordatorio ────────────── */}
          <div>
            <SectionTitle icon={MessageCircle} label="Mensajes de recordatorio" />
            <div className="space-y-4">
              <InputField label="Mensaje de WhatsApp">
                <textarea
                  rows={4}
                  value={form.reminderWhatsapp}
                  onChange={set("reminderWhatsapp")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-y"
                />
              </InputField>

              <InputField label="Asunto del email">
                <input
                  value={form.reminderEmailSubject}
                  onChange={set("reminderEmailSubject")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </InputField>

              <InputField label="Cuerpo del email">
                <textarea
                  rows={6}
                  value={form.reminderEmailBody}
                  onChange={set("reminderEmailBody")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-y font-mono"
                />
              </InputField>

              <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Variables disponibles</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                  {REMINDER_VARIABLES.map((v) => (
                    <div key={v.key} className="flex items-baseline gap-2 text-xs">
                      <code className="text-blue-300 font-mono">{v.key}</code>
                      <span className="text-slate-500 truncate">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/30 transition-all"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
