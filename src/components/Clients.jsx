import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import Modal, { Field, Input, Textarea, Btn } from "./Modal";
import { UserPlus, Pencil, Trash2, Phone, Mail, MapPin, Search } from "lucide-react";

export default function Clients() {
  const store = useStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = store.clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      await store.deleteClient(id);
    } catch (e) {
      console.error("Error al eliminar cliente:", e);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">{store.clients.length} cliente{store.clients.length !== 1 ? "s" : ""} registrado{store.clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Btn onClick={() => setShowAdd(true)}>
          <UserPlus size={15} /> Nuevo cliente
        </Btn>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full bg-[#0d1224] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Contacto</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Dirección</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Préstamos</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => {
                  const loans = store.getClientLoans(client.id);
                  return (
                    <tr
                      key={client.id}
                      className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600/40 to-violet-600/40 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{client.name}</p>
                            <p className="text-xs text-slate-500">Desde {client.createdAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Phone size={11} /> {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Mail size={11} /> {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        {client.address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin size={11} /> {client.address}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          loans.length > 0
                            ? "bg-blue-900/40 text-blue-300 border border-blue-700/40"
                            : "bg-slate-800 text-slate-500"
                        }`}>
                          {loans.length} préstamo{loans.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditing(client)}
                            className="p-2 text-slate-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(client)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {(showAdd || editing) && (
        <ClientForm
          initial={editing}
          onSave={async (data) => {
            try {
              if (editing) {
                await store.updateClient(editing.id, data);
                setEditing(null);
              } else {
                await store.addClient(data);
                setShowAdd(false);
              }
            } catch (e) {
              console.error("Error al guardar cliente:", e);
            }
          }}
          onClose={() => { setShowAdd(false); setEditing(null); }}
        />
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
            <Btn variant="danger" onClick={() => handleDelete(confirmDelete.id)}>Eliminar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
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

  return (
    <Modal title={initial ? "Editar cliente" : "Nuevo cliente"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nombre completo *" error={errors.name}>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Ej: Juan Pérez"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
        <Field label="Teléfono">
          <input
            value={form.phone}
            onChange={set("phone")}
            placeholder="Ej: 0981-234567"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
        <Field label="Email">
          <input
            value={form.email}
            onChange={set("email")}
            placeholder="Ej: correo@email.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
        <Field label="Dirección">
          <input
            value={form.address}
            onChange={set("address")}
            placeholder="Ej: Av. España 123"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
        <div className="flex gap-3 justify-end pt-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={submit}>{initial ? "Guardar cambios" : "Registrar cliente"}</Btn>
        </div>
      </div>
    </Modal>
  );
}
