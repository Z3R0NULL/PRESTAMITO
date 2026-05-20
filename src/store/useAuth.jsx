import { useState, useEffect, createContext, useContext } from "react";
import { initSchema, loginUser } from "../lib/db.js";

const AuthContext = createContext(null);

const SESSION_KEY = "prestamito_user";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [ready, setReady]     = useState(false);
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        await initSchema();
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch (err) {
        console.error("DB init error:", err);
        setDbError(err.message ?? "Error al conectar con la base de datos");
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  async function login(username, password) {
    const loggedUser = await loginUser(username, password);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, ready, dbError, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
