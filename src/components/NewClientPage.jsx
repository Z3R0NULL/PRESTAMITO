/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/NewClientPage.jsx — Alta y edición de clientes
 * ─────────────────────────────────────────────────────────────────────────────
 *  Si recibe la prop `initial`, funciona como editor (actualiza el cliente).
 *  Si no, crea uno nuevo. Tras guardar invoca onSaved o navega a "clients".
 *  Valida los campos en el cliente antes de tocar la base.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import { Field, Btn } from "./Modal";
import { UserPlus, ArrowLeft, Search } from "lucide-react";

const inputCls =
  "w-full bg-[#0d1224] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors";

export default function NewClientPage({ setPage, initial, onSaved }) {
  const store = useStore();
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name:    initial?.name    ?? "",
    dni:     initial?.dni     ?? "",
    phone:   initial?.phone   ?? "",
    email:   initial?.email   ?? "",
    address: initial?.address ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    if (Object.keys(errs).length) return setErrors(errs);

    setSaving(true);
    try {
      if (isEdit) {
        await store.updateClient(initial.id, form);
      } else {
        await store.addClient(form);
      }
      if (onSaved) onSaved();
      else setPage("clients");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage("clients")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isEdit ? "Modifica los datos del cliente" : "Completa los datos para registrar un cliente"}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-700/40 flex items-center justify-center">
            <UserPlus size={16} className="text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Información personal</p>
        </div>

        <Field label="Nombre completo *" error={errors.name}>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Ej: Juan Pérez"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono">
            <input
              value={form.phone}
              onChange={set("phone")}
              placeholder="Ej: 0981-234567"
              className={inputCls}
            />
          </Field>
          <Field label="DNI / ID">
            <div className="relative">
              <input
                value={form.dni}
                onChange={set("dni")}
                placeholder="Ej: 12345678"
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => {
                  const n = form.name.trim();
                  if (!n) return;
                  const url = `https://www.dateas.com/es/consulta_cuit_cuil?${new URLSearchParams({ name: n })}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                disabled={!form.name.trim()}
                title={form.name.trim() ? "Buscar DNI en Dateas" : "Ingresá el nombre primero"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </Field>
        </div>

        <Field label="Email">
          <input
            value={form.email}
            onChange={set("email")}
            placeholder="Ej: correo@email.com"
            type="email"
            className={inputCls}
          />
        </Field>

        <Field label="Dirección">
          <input
            value={form.address}
            onChange={set("address")}
            placeholder="Ej: Av. España 123"
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
          <Btn variant="secondary" onClick={() => setPage("clients")}>
            Cancelar
          </Btn>
          <Btn onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar cliente"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
