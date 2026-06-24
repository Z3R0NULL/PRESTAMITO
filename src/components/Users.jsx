/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/Users.jsx — Gestión de usuarios (solo admin)
 * ─────────────────────────────────────────────────────────────────────────────
 *  Lista los usuarios del sistema y permite crear, editar credenciales o
 *  eliminar. Solo es accesible cuando useAuth().isAdmin === true: la entrada
 *  del sidebar se oculta para los demás.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, Shield, User, Eye, EyeOff, RefreshCw, Pencil } from "lucide-react";
import { fetchUsers, createUserByAdmin, deleteUser, updateUser } from "../lib/db.js";
import { useAuth } from "../store/useAuth.jsx";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0d1224] border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Create modal ──────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null); // user object
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchUsers();
      setUsers(list);
    } catch (e) {
      setError(e.message ?? "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    if (!createUsername.trim()) { setCreateError("El nombre de usuario es obligatorio"); return; }
    if (createPassword.length < 4) { setCreateError("La contraseña debe tener al menos 4 caracteres"); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createUserByAdmin(createUsername, createPassword);
      setUsers((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch (e) {
      setCreateError(e.message ?? "Error al crear usuario");
    } finally {
      setCreateLoading(false);
    }
  }

  function openCreate() {
    setCreateUsername("");
    setCreatePassword("");
    setCreateError(null);
    setShowCreate(true);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function openEdit(u) {
    setEditTarget(u);
    setEditUsername(u.username);
    setEditPassword("");
    setEditError(null);
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editUsername.trim()) { setEditError("El nombre de usuario es obligatorio"); return; }
    const updates = {};
    if (editUsername.trim().toLowerCase() !== editTarget.username) updates.username = editUsername.trim();
    if (editPassword) updates.password = editPassword;
    if (Object.keys(updates).length === 0) { setEditTarget(null); return; }

    setEditLoading(true);
    setEditError(null);
    try {
      await updateUser(editTarget.id, updates);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? { ...u, username: updates.username ?? u.username }
            : u
        )
      );
      setEditTarget(null);
    } catch (e) {
      setEditError(e.message ?? "Error al actualizar usuario");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(u) {
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      setError(e.message ?? "Error al eliminar usuario");
    } finally {
      setConfirmDelete(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de accesos al sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <UserPlus size={15} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl px-4 py-3 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total usuarios</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-[#0d1224] border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Operadores</p>
          <p className="text-2xl font-bold text-white">
            {users.filter((u) => u.role === "user").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1224] border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {users.map((u) => {
              const isCurrentUser = u.id === currentUser?.id;
              const isAdminUser = u.role === "admin";
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isAdminUser
                        ? "bg-amber-600 text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm truncate">{u.username}</span>
                      {isCurrentUser && (
                        <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-700/40 px-2 py-0.5 rounded-full">
                          tú
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isAdminUser ? (
                        <>
                          <Shield size={11} className="text-amber-400" />
                          <span className="text-xs text-amber-400">Administrador</span>
                        </>
                      ) : (
                        <>
                          <User size={11} className="text-slate-500" />
                          <span className="text-xs text-slate-500">Operador</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-600 hidden sm:block">
                    {new Date(u.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Actions — edit + delete for all users except self */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-950/30 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <Pencil size={14} />
                    </button>
                    {!isCurrentUser && (
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create modal ─────────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Nuevo usuario" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Nombre de usuario</label>
              <input
                type="text"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                placeholder="ej. operador01"
                autoFocus
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Contraseña</label>
              <PasswordInput
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
              />
            </div>
            {createError && (
              <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/40 rounded-lg px-3 py-2">
                {createError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {createLoading ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Editar — ${editTarget.username}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Nombre de usuario</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                autoFocus
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Nueva contraseña{" "}
                <span className="text-slate-600 font-normal">(dejar vacío para no cambiar)</span>
              </label>
              <PasswordInput
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Nueva contraseña"
              />
            </div>
            {editError && (
              <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/40 rounded-lg px-3 py-2">
                {editError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                {editLoading ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────────────── */}
      {confirmDelete && (
        <Modal title="Eliminar usuario" onClose={() => setConfirmDelete(null)}>
          <div className="space-y-5">
            <p className="text-sm text-slate-300">
              ¿Estás seguro de que querés eliminar al usuario{" "}
              <span className="text-white font-semibold">{confirmDelete.username}</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
