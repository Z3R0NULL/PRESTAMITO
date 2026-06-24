/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  components/LoginPage.jsx — Pantalla de inicio de sesión
 * ─────────────────────────────────────────────────────────────────────────────
 *  Se muestra cuando AuthGate detecta que no hay sesión activa.
 *  Llama a useAuth().login(username, password); si falla muestra el error.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from "react";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../store/useAuth.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message ?? "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* bg-slate-950 = #020617 */
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
            <TrendingUp size={26} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prestamito</h1>
          <p className="text-sm text-slate-400 mt-1">Ingresá con tu cuenta</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-700/60 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Usuario */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-medium rounded-lg transition-all mt-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-5">
          Prestamito · Acceso restringido
        </p>

      </div>
    </div>
  );
}
