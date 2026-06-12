import { useState } from "react";
import { SCRIPT_URL } from "../App";

export default function PantallaPin({ onPinValido }) {
  const [pin, setPin] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    const pinLimpio = pin.trim().toUpperCase();
    if (!pinLimpio) {
      setError("Ingresá tu código de invitado.");
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const res = await fetch(
        `${SCRIPT_URL}?accion=validar_pin&pin=${pinLimpio}`,
        {
          redirect: "follow",
        },
      );
      const data = await res.json();

      if (data.ok) {
        onPinValido({
          pin: pinLimpio,
          nombre: data.nombre,
          ya_envio: data.ya_envio,
        });
      } else {
        setError(data.error || "Código inválido.");
      }
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="pantalla-pin">
      <div className="pin-card">
        <div className="pin-icono">🔑</div>
        <h2 className="pin-titulo">Ingresá tu código</h2>
        <p className="pin-desc">
          El organizador te mandó un código único cuando confirmaste tu
          participación. Ingresalo para acceder al formulario.
        </p>

        <div className="pin-input-wrap">
          <input
            className={`pin-input ${error ? "pin-input--error" : ""}`}
            type="text"
            maxLength={6}
            placeholder="Ej: A001"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {error && <p className="pin-error">{error}</p>}

        <button
          className="btn-primario"
          onClick={handleSubmit}
          disabled={cargando || !pin.trim()}
        >
          {cargando ? (
            <span className="btn-spinner">
              <span className="spinner" /> Validando…
            </span>
          ) : (
            "Ingresar →"
          )}
        </button>
      </div>
    </div>
  );
}
