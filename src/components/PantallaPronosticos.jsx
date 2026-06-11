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

export default function PantallaPronosticos({ usuario, onEnvioExitoso }) {
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({}); // { partido_id: { goles_local, goles_visitante } }
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // ── Cargar partidos al montar ──
  useEffect(() => {
    fetch(`${SCRIPT_URL}?accion=partidos`, { redirect: "follow" })
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
    // Solo permitir números entre 0 y 99
    const num = valor.replace(/[^0-9]/g, "").slice(0, 2);
    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [equipo]: num },
    }));
  }

  // ── Validar que todos los partidos tienen pronóstico completo ──
  function todosCompletos() {
    return partidos.every((p) => {
      const pron = pronosticos[p.id];
      return pron && pron.goles_local !== "" && pron.goles_visitante !== "";
    });
  }

  async function handleEnvio() {
    if (!todosCompletos()) return;

    setEnviando(true);
    setError(null);

    const payload = {
      pin: usuario.pin,
      pronosticos: partidos.map((p) => ({
        partido_id: p.id,
        goles_local: parseInt(pronosticos[p.id].goles_local),
        goles_visitante: parseInt(pronosticos[p.id].goles_visitante),
      })),
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

  // ── Agrupar partidos por jornada ──
  const jornadas = partidos.reduce((acc, p) => {
    const j = p.jornada;
    if (!acc[j]) acc[j] = [];
    acc[j].push(p);
    return acc;
  }, {});

  const completados = partidos.filter((p) => {
    const pron = pronosticos[p.id];
    return pron && pron.goles_local !== "" && pron.goles_visitante !== "";
  }).length;

  if (cargando) {
    return <p className="estado-msg">Cargando partidos…</p>;
  }

  if (error && partidos.length === 0) {
    return <p className="estado-msg error">{error}</p>;
  }

  return (
    <div className="pantalla-pronosticos">
      {/* Bienvenida */}
      <div className="bienvenida-card">
        <span className="bienvenida-emoji">👋</span>
        <div>
          <p className="bienvenida-nombre">Hola, {usuario.nombre}</p>
          <p className="bienvenida-desc">
            Completá todos los pronósticos para poder enviar.
          </p>
        </div>
      </div>

      {/* Progreso */}
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

      {/* Partidos agrupados por jornada */}
      {Object.entries(jornadas).map(([jornada, ps]) => (
        <section key={jornada} className="jornada-seccion">
          <h2 className="section-title">Fecha {jornada}</h2>

          <div className="partidos-lista">
            {ps.map((partido) => {
              const pron = pronosticos[partido.id] || {
                goles_local: "",
                goles_visitante: "",
              };
              const completo =
                pron.goles_local !== "" && pron.goles_visitante !== "";

              return (
                <div
                  key={partido.id}
                  className={`partido-card ${completo ? "partido-card--completo" : ""}`}
                >
                  {/* Info del partido */}
                  <div className="partido-info">
                    <span className="partido-estadio">
                      🏟 {partido.estadio}
                    </span>
                    <span className="partido-fecha">
                      {partido.fecha} · {partido.hora}
                    </span>
                  </div>

                  {/* Fila de pronóstico */}
                  <div className="partido-fila">
                    {/* Equipo local */}
                    <div className="equipo equipo--local">
                      <span
                        className={`fi fi-${BANDERAS[partido.equipo_local] || "un"} equipo-bandera`}
                      />
                      <span className="equipo-nombre">
                        {partido.equipo_local}
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="partido-inputs">
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
                    </div>

                    {/* Equipo visitante */}
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

      {/* Error de envío */}
      {error && <p className="estado-msg error">{error}</p>}

      {/* Botón enviar */}
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
          `Completá todos los partidos (${completados}/${partidos.length})`
        )}
      </button>
    </div>
  );
}
