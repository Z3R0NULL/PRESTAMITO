import { useState } from "react";
import { useStore } from "../store/useStore.jsx";
import Modal, { Field, Input, Textarea, Btn } from "./Modal";
import { UserPlus, Pencil, Trash2, Phone, Mail, MapPin, Search, CreditCard } from "lucide-react";

export default function Clients() {
  const store = useStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = store.clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dni?.toLowerCase().includes(search.toLowerCase()) ||
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
          placeholder="Buscar por nombre, DNI, teléfono o email..."
          className="w-full bg-[#0d1224] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* List */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500 text-sm">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((client) => {
              const loans = store.getClientLoans(client.id);
              return (
                <div key={client.id} className="flex items-start gap-3 px-4 py-4 hover:bg-slate-800/20 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600/40 to-violet-600/40 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300 flex-shrink-0 mt-0.5">
                    {client.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-white leading-tight">{client.name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {client.dni && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <CreditCard size={10} /> {client.dni}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone size={10} /> {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Mail size={10} /> {client.email}
                        </span>
                      )}
                      {client.address && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={10} /> {client.address}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      loans.length > 0
                        ? "bg-blue-900/40 text-blue-300 border border-blue-700/40"
                        : "bg-slate-800 text-slate-500"
                    }`}>
                      {loans.length} préstamo{loans.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditing(client)}
                      className="p-2 text-slate-500 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(client)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
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
    dni: initial?.dni ?? "",
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
        <Field label="DNI / ID">
          <input
            value={form.dni}
            onChange={set("dni")}
            placeholder="Ej: 12345678"
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
