import { useState } from "react";
import "./App.css";
import PantallaPin from "./components/PantallaPin";
import PantallaPronosticos from "./components/PantallaPronosticos";
import PantallaExito from "./components/PantallaExito";

// ─────────────────────────────────────────────
//  CONFIGURACIÓN
// ─────────────────────────────────────────────
export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw9SFSI3DHUw01s9gt9tKbNSMRmlH67w5z5vvHgW9fqnG1b2-Hl2QXVqT-XWAmV2lJs/exec";

export const TORNEO_NOMBRE = "Prode Mundial 2026";
export const TORNEO_SUBTITULO = "Primeras Fechas";

// ─────────────────────────────────────────────
//  PANTALLAS
// ─────────────────────────────────────────────
const PANTALLA = {
  PIN: "pin",
  PRONOSTICOS: "pronosticos",
  EXITO: "exito",
};

export default function App() {
  const [pantalla, setPantalla] = useState(PANTALLA.PIN);
  const [usuario, setUsuario] = useState(null); // { pin, nombre }

  function onPinValido(datosUsuario) {
    setUsuario(datosUsuario);
    setPantalla(PANTALLA.PRONOSTICOS);
  }

  function onEnvioExitoso() {
    setPantalla(PANTALLA.EXITO);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-banda" />
        <div className="header-content">
          <span className="header-eyebrow">⚽ Torneo de pronósticos</span>
          <h1 className="header-title">{TORNEO_NOMBRE}</h1>
          <p className="header-sub">{TORNEO_SUBTITULO}</p>
        </div>
      </header>

      <main className="main">
        {pantalla === PANTALLA.PIN && <PantallaPin onPinValido={onPinValido} />}
        {pantalla === PANTALLA.PRONOSTICOS && (
          <PantallaPronosticos
            usuario={usuario}
            onEnvioExitoso={onEnvioExitoso}
          />
        )}
        {pantalla === PANTALLA.EXITO && <PantallaExito usuario={usuario} />}
      </main>

      <footer className="footer">
        <p>Prode organizado con ❤️por Sami · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
