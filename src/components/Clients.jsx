/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Clients.jsx — Listado y gestión de clientes
 * ─────────────────────────────────────────────────────────────────────────────
 *  Permite buscar, ordenar, ver historial, editar y eliminar clientes.
 *  El alta/edición real ocurre en NewClientPage. Aquí solo se listan y se
 *  disparan acciones via callbacks (onEditClient, onViewHistory).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useMemo } from "react";
import { useStore } from "../store/useStore.jsx";
import Modal, { Field, Btn } from "./Modal";
import {
  UserPlus, Pencil, Trash2, Phone, Mail, MapPin, Search,
  CreditCard, X, LayoutGrid, LayoutList, ArrowUpDown, ChevronDown, Check, History,
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest",   label: "Más recientes" },
  { value: "oldest",   label: "Más antiguos"  },
  { value: "name_az",  label: "Nombre A→Z"    },
  { value: "name_za",  label: "Nombre Z→A"    },
  { value: "loans_desc", label: "Más préstamos" },
  { value: "loans_asc",  label: "Menos préstamos" },
];

const AVATAR_COLORS = [
  "bg-indigo-900/50 text-indigo-300",
  "bg-violet-900/50 text-violet-300",
  "bg-emerald-900/50 text-emerald-300",
  "bg-amber-900/50  text-amber-300",
  "bg-rose-900/50   text-rose-300",
  "bg-sky-900/50    text-sky-300",
];

function getInitials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Clients({ setPage, onViewHistory, onEditClient }) {
  const store = useStore();
  const [search, setSearch]           = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [view, setView]               = useState("grid");
  const [sort, setSort]               = useState("newest");
  const [sortOpen, setSortOpen]       = useState(false);

  // Close sort dropdown on outside click
  const closeSortOnOutside = (e) => {
    if (!e.target.closest("[data-sort-dd]")) setSortOpen(false);
  };
  useState(() => {
    document.addEventListener("mousedown", closeSortOnOutside);
    return () => document.removeEventListener("mousedown", closeSortOnOutside);
  }, []);

  const filtered = useMemo(() => {
    let list = store.clients.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.dni?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) => {
      switch (sort) {
        case "oldest":     return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "name_az":    return (a.name || "").localeCompare(b.name || "");
        case "name_za":    return (b.name || "").localeCompare(a.name || "");
        case "loans_desc": return (store.getClientLoans(b.id)?.length || 0) - (store.getClientLoans(a.id)?.length || 0);
        case "loans_asc":  return (store.getClientLoans(a.id)?.length || 0) - (store.getClientLoans(b.id)?.length || 0);
        default:           return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [store.clients, search, sort]);

  const handleDelete = async (id) => {
    try { await store.deleteClient(id); } catch (e) { console.error(e); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {store.clients.length} cliente{store.clients.length !== 1 ? "s" : ""} registrado{store.clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setPage("new-client")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Search + controls */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI, teléfono o email..."
            className="w-full bg-[#0d1224] border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={13} />
            </button>
          )}
        </div>

        {/* View + Sort */}
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              title="Vista cuadrícula"
              className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView("list")}
              title="Vista lista"
              className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              <LayoutList size={14} />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-0.5" />
            <div className="relative" data-sort-dd>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 pl-2 pr-2 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown size={13} className="text-slate-400" />
                <span className="hidden sm:inline text-xs">{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                <ChevronDown size={11} className={`text-slate-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm border-b border-slate-800 last:border-0 transition-colors ${
                        sort === opt.value
                          ? "bg-indigo-900/30 text-indigo-400 font-medium"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {sort === opt.value && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <UserPlus size={40} className="mb-3 opacity-30" />
          <p className="font-medium">{search ? "No hay clientes que coincidan" : "Sin clientes aún"}</p>
          {!search && (
            <button onClick={() => setPage("new-client")} className="mt-3 text-sm text-indigo-400 hover:underline">
              Agregar primer cliente
            </button>
          )}
        </div>

      ) : view === "list" ? (
        /* ── LIST VIEW ── */
        <div className="bg-[#0d1224] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Préstamos</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((client) => {
                  const loans = store.getClientLoans(client.id);
                  const color = AVATAR_COLORS[(client.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
                  return (
                    <tr key={client.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{client.name}</p>
                            {client.dni && <p className="text-xs text-slate-500">DNI {client.dni}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-slate-400 text-xs">{client.phone || "—"}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-400 text-xs truncate max-w-[160px]">{client.email || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          loans.length > 0 ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700/40" : "bg-slate-800 text-slate-500"
                        }`}>
                          {loans.length} préstamo{loans.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onViewHistory(client.id)} title="Ver historial de préstamos" className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-900/20 transition-colors"><History size={14} /></button>
                          <button onClick={() => onEditClient(client)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setConfirmDelete(client)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

      ) : (
        /* ── GRID VIEW ── */
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const loans = store.getClientLoans(client.id);
            const color = AVATAR_COLORS[(client.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
            return (
              <div
                key={client.id}
                className="bg-[#0d1224] border border-slate-800 rounded-xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${color}`}>
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{client.name}</p>
                      {client.dni && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <CreditCard size={11} className="text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-500">{client.dni}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => onViewHistory(client.id)} title="Ver historial de préstamos" className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-900/20 transition-colors"><History size={14} /></button>
                    <button onClick={() => onEditClient(client)} className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/20 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDelete(client)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-1.5">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Footer: loan badge + history button */}
                <div className="pt-2 border-t border-slate-800 mt-auto flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    loans.length > 0
                      ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700/40"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}>
                    {loans.length} préstamo{loans.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => onViewHistory(client.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-900/20 border border-sky-800/40 hover:border-sky-600/60 transition-colors"
                  >
                    <History size={12} /> Ver historial
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal title="Eliminar cliente" onClose={() => setConfirmDelete(null)}>
          <p className="text-slate-300 text-sm mb-6">
            ¿Seguro que deseas eliminar a <strong className="text-white">{confirmDelete.name}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Btn>
            <Btn variant="danger"    onClick={() => handleDelete(confirmDelete.id)}>Eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm]     = useState({
    name:    initial?.name    ?? "",
    dni:     initial?.dni     ?? "",
    phone:   initial?.phone   ?? "",
    email:   initial?.email   ?? "",
    address: initial?.address ?? "",
  });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    if (Object.keys(errs).length) return setErrors(errs);
    onSave(form);
  };

  const inputCls = "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors";

  return (
    <Modal title={initial ? "Editar cliente" : "Nuevo cliente"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre completo *" error={errors.name}>
          <input value={form.name}    onChange={set("name")}    placeholder="Ej: Juan Pérez"       className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="DNI / ID">
            <input value={form.dni}     onChange={set("dni")}     placeholder="Ej: 12345678"         className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input value={form.phone}   onChange={set("phone")}   placeholder="Ej: 0981-234567"      className={inputCls} />
          </Field>
        </div>
        <Field label="Email">
          <input value={form.email}   onChange={set("email")}   placeholder="Ej: correo@email.com"  className={inputCls} type="email" />
        </Field>
        <Field label="Dirección">
          <input value={form.address} onChange={set("address")} placeholder="Ej: Av. España 123"   className={inputCls} />
        </Field>
        <div className="flex gap-3 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit}>{initial ? "Guardar cambios" : "Registrar cliente"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
