import { useEffect, useState } from "react";
import { SCRIPT_URL } from "../App";

const BANDERAS = {
  Argentina: "ar",
  México: "mx",
  Sudáfrica: "za",
  "Corea del Sur": "kr",
  "República Checa": "cz",
  Canadá: "ca",
  "Bosnia y Herzegovina": "ba",
  "Estados Unidos": "us",
  Paraguay: "py",
  Qatar: "qa",
  Suiza: "ch",
  Brasil: "br",
  Marruecos: "ma",
  Haití: "ht",
  Escocia: "gb-sct",
  Australia: "au",
  Turquía: "tr",
  Argelia: "dz",
  Austria: "at",
  Jordania: "jo",
};

// Re-evalúa el estado de bloqueo cada segundo
function useTiempoActual() {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);
  return ahora;
}

// ── Determina si un partido ya comenzó ──
// fecha: "11/06/2026", hora: "16:00" → ambos strings desde el Sheet
function partidoEmpezado(fecha, hora, ahora) {
  try {
    const [dia, mes, anio] = fecha.split("/").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const inicioUTC = Date.UTC(anio, mes - 1, dia, hh + 3, mm);
    return ahora >= inicioUTC;
  } catch {
    return false;
  }
}

function calcularCountdown(fecha, hora, ahora) {
  try {
    const [dia, mes, anio] = fecha.split("/").map(Number);
    const [hh, mm] = hora.split(":").map(Number);
    const inicioUTC = Date.UTC(anio, mes - 1, dia, hh + 3, mm);
    const diff = inicioUTC - ahora;
    if (diff <= 0) return null;

    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    if (horas > 0) return `${horas}h ${String(minutos).padStart(2, "0")}m`;
    if (minutos > 0) return `${minutos}m ${String(segundos).padStart(2, "0")}s`;
    return `${segundos}s`;
  } catch {
    return null;
  }
}

export default function PantallaPronosticos({ usuario, onEnvioExitoso }) {
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const ahora = useTiempoActual();

  useEffect(() => {
    fetch(`${SCRIPT_URL}?accion=partidos`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setPartidos(data.partidos);
          const init = {};
          data.partidos.forEach((p) => {
            init[p.id] = { goles_local: "", goles_visitante: "" };
          });
          setPronosticos(init);
        } else {
          setError("No se pudieron cargar los partidos.");
        }
      })
      .catch(() => setError("Error de conexión al cargar los partidos."))
      .finally(() => setCargando(false));
  }, []);

  function handleGoles(partidoId, equipo, valor) {
    const num = valor.replace(/[^0-9]/g, "").slice(0, 2);
    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [equipo]: num },
    }));
  }

  // Un partido bloqueado cuenta como "completado" automáticamente
  // (sus puntos serán 0 pero no impide el envío)
  function estaCompleto(partido) {
    if (partidoEmpezado(partido.fecha, partido.hora, ahora)) return true;
    const pron = pronosticos[partido.id];
    return pron && pron.goles_local !== "" && pron.goles_visitante !== "";
  }

  function todosCompletos() {
    return partidos.every((p) => estaCompleto(p));
  }

  async function handleEnvio() {
    if (!todosCompletos()) return;
    setEnviando(true);
    setError(null);

    // Los partidos bloqueados se envían con 0-0 por defecto
    const payload = {
      pin: usuario.pin,
      pronosticos: partidos.map((p) => {
        const bloqueado = partidoEmpezado(p.fecha, p.hora, ahora);
        return {
          partido_id: p.id,
          goles_local: bloqueado
            ? -1
            : parseInt(pronosticos[p.id]?.goles_local || 0),
          goles_visitante: bloqueado
            ? -1
            : parseInt(pronosticos[p.id]?.goles_visitante || 0),
        };
      }),
    };

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        onEnvioExitoso();
      } else {
        setError(data.error || "Ocurrió un error al enviar.");
      }
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const jornadas = partidos.reduce((acc, p) => {
    if (!acc[p.jornada]) acc[p.jornada] = [];
    acc[p.jornada].push(p);
    return acc;
  }, {});

  const completados = partidos.filter((p) => estaCompleto(p)).length;

  if (cargando) return <p className="estado-msg">Cargando partidos…</p>;
  if (error && partidos.length === 0)
    return <p className="estado-msg error">{error}</p>;

  return (
    <div className="pantalla-pronosticos">
      <div className="bienvenida-card">
        <span className="bienvenida-emoji">👋</span>
        <div>
          <p className="bienvenida-nombre">Hola, {usuario.nombre}</p>
          <p className="bienvenida-desc">
            Completá todos los pronósticos para poder enviar.
          </p>
        </div>
      </div>

      <div className="progreso-wrap">
        <div className="progreso-texto">
          <span>
            {completados} de {partidos.length} partidos completados
          </span>
          {todosCompletos() && (
            <span className="progreso-listo">✅ Listo para enviar</span>
          )}
        </div>
        <div className="progreso-barra-bg">
          <div
            className="progreso-barra-fill"
            style={{
              width: `${partidos.length ? (completados / partidos.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {Object.entries(jornadas).map(([jornada, ps]) => (
        <section key={jornada} className="jornada-seccion">
          <h2 className="section-title">Fecha {jornada}</h2>
          <div className="partidos-lista">
            {ps.map((partido) => {
              const bloqueado = partidoEmpezado(
                partido.fecha,
                partido.hora,
                ahora,
              );
              const countdown = calcularCountdown(
                partido.fecha,
                partido.hora,
                ahora,
              );
              const pron = pronosticos[partido.id] || {
                goles_local: "",
                goles_visitante: "",
              };
              const completo = estaCompleto(partido);

              return (
                <div
                  key={partido.id}
                  className={`partido-card ${completo ? "partido-card--completo" : ""} ${bloqueado ? "partido-card--bloqueado" : ""}`}
                >
                  <div className="partido-info">
                    <span className="partido-estadio">
                      🏟 {partido.estadio}
                    </span>
                    <span className="partido-fecha">
                      {partido.fecha} · {partido.hora}
                    </span>
                    {bloqueado ? (
                      <span className="partido-badge-cerrado">⏱ Cerrado</span>
                    ) : (
                      countdown && (
                        <span className="partido-countdown">
                          Cierra en: {countdown}
                        </span>
                      )
                    )}
                  </div>

                  <div className="partido-fila">
                    <div className="equipo equipo--local">
                      <span
                        className={`fi fi-${BANDERAS[partido.equipo_local] || "un"} equipo-bandera`}
                      />
                      <span className="equipo-nombre">
                        {partido.equipo_local}
                      </span>
                    </div>

                    <div className="partido-inputs">
                      {bloqueado ? (
                        <span className="partido-bloqueado-label">
                          Sin pronóstico
                        </span>
                      ) : (
                        <>
                          <input
                            className="goles-input"
                            type="number"
                            min="0"
                            max="99"
                            placeholder="–"
                            value={pron.goles_local}
                            onChange={(e) =>
                              handleGoles(
                                partido.id,
                                "goles_local",
                                e.target.value.replace(/[^0-9]/g, ""),
                              )
                            }
                            inputMode="numeric"
                          />
                          <span className="partido-guion">:</span>
                          <input
                            className="goles-input"
                            type="number"
                            min="0"
                            max="99"
                            placeholder="–"
                            value={pron.goles_visitante}
                            onChange={(e) =>
                              handleGoles(
                                partido.id,
                                "goles_visitante",
                                e.target.value.replace(/[^0-9]/g, ""),
                              )
                            }
                            inputMode="numeric"
                          />
                        </>
                      )}
                    </div>

                    <div className="equipo equipo--visitante">
                      <span
                        className={`fi fi-${BANDERAS[partido.equipo_visitante] || "un"} equipo-bandera`}
                      />
                      <span className="equipo-nombre">
                        {partido.equipo_visitante}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && <p className="estado-msg error">{error}</p>}

      <button
        className={`btn-primario btn-enviar ${!todosCompletos() ? "btn-primario--disabled" : ""}`}
        onClick={handleEnvio}
        disabled={!todosCompletos() || enviando}
      >
        {enviando ? (
          <span className="btn-spinner">
            <span className="spinner" /> Enviando…
          </span>
        ) : todosCompletos() ? (
          "Enviar pronósticos 🚀"
        ) : (
          `Completá los partidos disponibles (${completados}/${partidos.length})`
        )}
      </button>
    </div>
  );
}
