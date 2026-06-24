/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  main.jsx — Punto de entrada de la aplicación
 * ─────────────────────────────────────────────────────────────────────────────
 *  Monta el árbol de React dentro del <div id="root"> de index.html.
 *  StrictMode activa verificaciones extra de React en desarrollo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
