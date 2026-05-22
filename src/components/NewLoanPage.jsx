import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { useCurrency } from "../store/useCurrency.js";
import { Field, Btn } from "./Modal";
import CurrencyInput from "./CurrencyInput.jsx";
import { HandCoins, ArrowLeft, Percent, Calendar, DollarSign } from "lucide-react";

const inputCls =
  "w-full bg-[#0d1224] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors";

export default function NewLoanPage({ setPage }) {
  const store = useStore();
  const fmt = useCurrency();

  const [form, setForm] = useState({
    clientId: store.clients[0]?.id ?? "",
    amountNumeric: null,
    amountDisplay: "",
    interestRate: "5",
    interestType: "monthly",
    installments: "12",
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const preview =
    form.amountNumeric && form.installments
      ? store.calcInstallment(
          form.amountNumeric,
          Number(form.interestRate || 0),
          Number(form.installments),
          form.interestType
        )
      : null;

  const totalPreview = preview ? preview * Number(form.installments) : null;
  const interestPreview = totalPreview ? totalPreview - form.amountNumeric : null;

  const interestLabel =
    form.interestType === "monthly" ? "Interés mensual (%)" : "Interés total (%)";
  const interestHint =
    form.interestType === "monthly"
      ? "Se aplica por cuota sobre el capital"
      : "Se aplica una sola vez sobre el capital total";

  const submit = async () => {
    const errs = {};
    if (!form.clientId) errs.clientId = "Selecciona un cliente";
    if (!form.amountNumeric || form.amountNumeric <= 0) errs.amount = "Monto inválido";
    if (!form.installments || isNaN(Number(form.installments)) || Number(form.installments) <= 0)
      errs.installments = "Cuotas inválidas";
    if (Object.keys(errs).length) return setErrors(errs);

    setSaving(true);
    try {
      await store.addLoan({
        clientId: form.clientId,
        amount: form.amountNumeric,
        interestRate: Number(form.interestRate),
        interestType: form.interestType,
        installments: Number(form.installments),
        startDate: form.startDate,
        notes: form.notes,
      });
      setPage("loans");
    } catch (e) {
      console.error("Error al guardar préstamo:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage("loans")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo préstamo</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configura los términos del préstamo</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-blue-900/40 border border-blue-700/40 flex items-center justify-center">
            <HandCoins size={16} className="text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Detalles del préstamo</p>
        </div>

        <Field label="Cliente *" error={errors.clientId}>
          <select
            value={form.clientId}
            onChange={set("clientId")}
            className={inputCls}
          >
            {store.clients.length === 0 ? (
              <option value="">— Sin clientes —</option>
            ) : (
              store.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </Field>

        <Field label="Monto del préstamo *" error={errors.amount}>
          <CurrencyInput
            value={form.amountDisplay}
            onChange={(numeric, display) =>
              setForm((f) => ({ ...f, amountNumeric: numeric, amountDisplay: display }))
            }
            className="w-full bg-[#0d1224] border border-slate-800 rounded-xl py-2.5 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>

        {/* Interest type toggle */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Tipo de interés</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "monthly", label: "Mensual", desc: "% por cuota" },
              { value: "total",   label: "Total",   desc: "% sobre capital" },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, interestType: value }))}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-left ${
                  form.interestType === value
                    ? "bg-violet-600/20 border-violet-500/60 text-violet-300"
                    : "bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                <span className="block">{label}</span>
                <span
                  className={`block text-xs font-normal mt-0.5 ${
                    form.interestType === value ? "text-violet-400" : "text-slate-600"
                  }`}
                >
                  {desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={interestLabel} error={errors.interestRate}>
            <div className="relative">
              <input
                type="number"
                value={form.interestRate}
                onChange={set("interestRate")}
                step="0.5"
                min="0"
                max="100"
                className={inputCls + " pr-8"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                %
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{interestHint}</p>
          </Field>
          <Field label="N° de cuotas" error={errors.installments}>
            <input
              type="number"
              value={form.installments}
              onChange={set("installments")}
              min="1"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Fecha de inicio">
          <input
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
            className={inputCls}
          />
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={2}
            placeholder="Motivo del préstamo..."
            className="w-full bg-[#0d1224] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </Field>

        {/* Preview */}
        {preview !== null && form.amountNumeric > 0 && (
          <div className="bg-blue-950/40 border border-blue-700/30 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-blue-400">Cuota mensual</p>
              <p className="text-sm font-bold text-blue-200">{fmt(preview)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-400">Total intereses</p>
              <p className="text-sm font-bold text-blue-200">{fmt(interestPreview)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-400">Total a pagar</p>
              <p className="text-sm font-bold text-blue-200">{fmt(totalPreview)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
          <Btn variant="secondary" onClick={() => setPage("loans")}>
            Cancelar
          </Btn>
          <Btn onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Registrar préstamo"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
