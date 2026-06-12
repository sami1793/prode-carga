import { useEffect, useState } from "react";
import "./App.css";
import PantallaPin from "./components/PantallaPin";
import PantallaPronosticos from "./components/PantallaPronosticos";
import PantallaExito from "./components/PantallaExito";
import PantallaMisPronosticos from "./components/PantallaMisPronosticos";

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxWM_dYY_-ml2jrt2Cv_ckK6aAq_iD3etUFWe9EnvlxYRy_Tcbrywp_-jDXRAMRWN_R/exec";
export const TORNEO_NOMBRE = "Prode Mundial 2026";
export const TORNEO_SUBTITULO = "16avos de final";

const PIN_STORAGE_KEY = "prode_pin";

const PANTALLA = {
  CARGANDO: "cargando",
  PIN: "pin",
  PRONOSTICOS: "pronosticos",
  MIS_PRONOSTICOS: "mis_pronosticos",
  EXITO: "exito",
};

export default function App() {
  const [pantalla, setPantalla] = useState(PANTALLA.CARGANDO);
  const [usuario, setUsuario] = useState(null);

  // ── Al montar: verificar si hay PIN guardado ──
  useEffect(() => {
    const pinGuardado = localStorage.getItem(PIN_STORAGE_KEY);
    if (!pinGuardado) {
      setPantalla(PANTALLA.PIN);
      return;
    }

    // Validar el PIN guardado contra el Script
    fetch(`${SCRIPT_URL}?accion=validar_pin&pin=${pinGuardado}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          // PIN válido — el Script devuelve ok:true solo si NO envió todavía
          setUsuario({ pin: pinGuardado, nombre: data.nombre });
          setPantalla(PANTALLA.PRONOSTICOS);
        }
        if (data.ok) {
          // const nombreGuardado =
          //   localStorage.getItem("prode_nombre") || data.nombre;
          localStorage.setItem("prode_nombre", data.nombre); // actualizar por si cambió
          setUsuario({ pin: pinGuardado, nombre: data.nombre });
          setPantalla(
            data.ya_envio ? PANTALLA.MIS_PRONOSTICOS : PANTALLA.PRONOSTICOS,
          );
        } else {
          // PIN inválido o deshabilitado — limpiar y pedir de nuevo
          localStorage.removeItem(PIN_STORAGE_KEY);
          localStorage.removeItem("prode_nombre");
          setPantalla(PANTALLA.PIN);
        }
      })
      .catch(() => {
        // Sin conexión — mostramos PIN por si acaso
        localStorage.removeItem(PIN_STORAGE_KEY);
        setPantalla(PANTALLA.PIN);
      });
  }, []);

  function onPinValido(datosUsuario) {
    localStorage.setItem(PIN_STORAGE_KEY, datosUsuario.pin);
    localStorage.setItem("prode_nombre", datosUsuario.nombre);
    setUsuario(datosUsuario);
    // Si ya envió → mis pronósticos, si no → formulario
    setPantalla(
      datosUsuario.ya_envio ? PANTALLA.MIS_PRONOSTICOS : PANTALLA.PRONOSTICOS,
    );
  }

  function onEnvioExitoso() {
    setPantalla(PANTALLA.EXITO);
  }

  function onVerMisPronosticos() {
    setPantalla(PANTALLA.MIS_PRONOSTICOS);
  }

  function onCerrarSesion() {
    localStorage.removeItem(PIN_STORAGE_KEY);
    localStorage.removeItem("prode_nombre");
    setUsuario(null);
    setPantalla(PANTALLA.PIN);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-banda" />
        <div className="header-content">
          <span className="header-eyebrow">⚽ Torneo de Los Siberianos</span>
          <h1 className="header-title">{TORNEO_NOMBRE}</h1>
          <p className="header-sub">{TORNEO_SUBTITULO}</p>
        </div>
      </header>

      <main className="main">
        {pantalla === PANTALLA.CARGANDO && (
          <p className="estado-msg">Cargando…</p>
        )}
        {pantalla === PANTALLA.PIN && <PantallaPin onPinValido={onPinValido} />}
        {pantalla === PANTALLA.PRONOSTICOS && (
          <PantallaPronosticos
            usuario={usuario}
            onEnvioExitoso={onEnvioExitoso}
          />
        )}
        {pantalla === PANTALLA.EXITO && (
          <PantallaExito
            usuario={usuario}
            onVerMisPronosticos={onVerMisPronosticos}
          />
        )}
        {pantalla === PANTALLA.MIS_PRONOSTICOS && (
          <PantallaMisPronosticos
            usuario={usuario}
            onCerrarSesion={onCerrarSesion}
          />
        )}
      </main>

      <footer className="footer">
        <p>Prode organizado con ❤️ · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
