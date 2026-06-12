export default function PantallaExito({ usuario, onVerMisPronosticos }) {
  return (
    <div className="pantalla-exito">
      <div className="exito-card">
        <div className="exito-icono">🎉</div>
        <h2 className="exito-titulo">¡Pronósticos enviados!</h2>
        <p className="exito-desc">
          Tus pronósticos fueron registrados correctamente,{" "}
          <strong>{usuario.nombre}</strong>. ¡Buena suerte!
        </p>
        <div className="exito-detalle">
          <span>🏆 Seguí el ranking en la página del torneo</span>
          <span>📱 Te avisamos por WhatsApp cuando haya novedades</span>
        </div>
        <button
          className="btn-primario btn-ver-pronosticos"
          onClick={onVerMisPronosticos}
        >
          Ver mis pronósticos →
        </button>
      </div>
    </div>
  );
}
