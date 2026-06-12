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

const PUNTOS_COLOR = {
  10: "pts-oro",
  7: "pts-celeste",
  5: "pts-verde",
  2: "pts-gris",
  0: "pts-rojo",
};

export default function PantallaMisPronosticos({ usuario, onCerrarSesion }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${SCRIPT_URL}?accion=mis_pronosticos&pin=${usuario.pin}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setPartidos(data.partidos);
        } else {
          setError(data.error);
        }
      })
      .catch(() => setError("No se pudo conectar. Revisá tu conexión."))
      .finally(() => setLoading(false));
  }, [usuario.pin]);

  const totalPuntos = partidos.reduce((sum, p) => sum + (p.puntos || 0), 0);
  const jugados = partidos.filter(
    (p) => p.goles_local_real !== "" && p.goles_visit_real !== "",
  ).length;

  if (loading) return <p className="estado-msg">Cargando tus pronósticos…</p>;
  if (error) return <p className="estado-msg error">{error}</p>;

  return (
    <div className="pantalla-mis-pronosticos">
      {/* ── Header usuario ── */}
      <div className="mis-header">
        <div className="mis-header-info">
          <span className="mis-bienvenida">👤 {usuario.nombre}</span>
          <span className="mis-subtitulo">Tus pronósticos</span>
        </div>
        <button className="btn-cerrar-sesion" onClick={onCerrarSesion}>
          Cerrar sesión
        </button>
      </div>

      {/* ── Resumen ── */}
      {jugados > 0 && (
        <div className="mis-resumen">
          <div className="resumen-item">
            <span className="resumen-valor">{totalPuntos}</span>
            <span className="resumen-label">pts totales</span>
          </div>
          <div className="resumen-sep" />
          <div className="resumen-item">
            <span className="resumen-valor">{jugados}</span>
            <span className="resumen-label">partidos jugados</span>
          </div>
          <div className="resumen-sep" />
          <div className="resumen-item">
            <span className="resumen-valor">{partidos.length - jugados}</span>
            <span className="resumen-label">pendientes</span>
          </div>
        </div>
      )}

      {/* ── Lista de partidos ── */}
      <div className="mis-partidos-lista">
        {partidos.map((p) => {
          const tieneResultado =
            p.goles_local_real !== "" && p.goles_visit_real !== "";
          const codigoLocal = BANDERAS[p.equipo_local] || "un";
          const codigoVisit = BANDERAS[p.equipo_visitante] || "un";
          const ptsColor = PUNTOS_COLOR[p.puntos] || "pts-gris";

          return (
            <div
              key={p.id}
              className={`mis-partido-card
                ${tieneResultado ? "mis-partido-card--jugado" : ""}
                ${p.sin_pronostico ? "mis-partido-card--sin-pron" : ""}
              `}
            >
              {/* Meta */}
              <div className="mis-partido-meta">
                <span className="mis-partido-fecha">
                  {p.fecha} · {p.hora}
                </span>
                {tieneResultado && p.puntos !== null && (
                  <span className={`mis-puntos-badge ${ptsColor}`}>
                    {p.puntos} pts
                  </span>
                )}
                {!tieneResultado && !p.sin_pronostico && (
                  <span className="mis-puntos-badge pts-pendiente">
                    ⏳ Pendiente
                  </span>
                )}
              </div>

              {/* Fila equipos */}
              <div className="mis-partido-fila">
                {/* Local */}
                <div className="mis-equipo mis-equipo--local">
                  <span className={`fi fi-${codigoLocal} mis-bandera`} />
                  <span className="mis-equipo-nombre">{p.equipo_local}</span>
                </div>

                {/* Centro: resultado real arriba, pronóstico abajo */}
                <div className="mis-centro">
                  {tieneResultado ? (
                    <div className="mis-resultado-real">
                      <span className="mis-gol-real">{p.goles_local_real}</span>
                      <span className="mis-sep">-</span>
                      <span className="mis-gol-real">{p.goles_visit_real}</span>
                    </div>
                  ) : (
                    <div className="mis-resultado-real mis-resultado-real--pendiente">
                      <span className="mis-vs">vs</span>
                    </div>
                  )}

                  {/* Pronóstico del usuario */}
                  {p.sin_pronostico ? (
                    <div className="mis-pron-label">Sin pronóstico</div>
                  ) : p.bloqueado ? (
                    <div className="mis-pron-label">Partido cerrado</div>
                  ) : (
                    <div className="mis-pron">
                      <span className="mis-gol-pron">{p.goles_local_pron}</span>
                      <span className="mis-sep-pron">-</span>
                      <span className="mis-gol-pron">{p.goles_visit_pron}</span>
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="mis-equipo mis-equipo--visitante">
                  <span className={`fi fi-${codigoVisit} mis-bandera`} />
                  <span className="mis-equipo-nombre">
                    {p.equipo_visitante}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
