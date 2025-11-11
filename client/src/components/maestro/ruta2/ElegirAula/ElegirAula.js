// client/src/components/maestro/ruta2/ElegirAula/ElegirAula.js
// client/src/components/maestro/ruta2/ElegirAula/ElegirAula.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosMaestro from "../../../../axiosConfig/axiosMaestros";
import "./ElegirAula.css";

// Utils
const msToCountdown = (ms) => {
  if (ms == null) return "";
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const displayNameFromAula = (a) => {
  const nombre = (a?.nombre || "").trim();
  if (nombre) return nombre;
  const etiqueta = (a?.grupoEtiqueta || "").trim();
  const materia = (a?.materia || "").trim();
  return `${etiqueta}${materia ? " - " + materia : ""}`.trim() || "Aula";
};

export default function ElegirAula() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [estado, setEstado] = useState({ liveNow: [], upcomingSoon: [], justEnded: [], nowISO: "" });
  const [aulas, setAulas] = useState([]);

  const [countdownMs, setCountdownMs] = useState(null);
  const countdownRef = useRef(null);

  // ------- Fetch inicial -------
  useEffect(() => {
    let cancel = false;
    async function fetchData() {
      setLoading(true);
      setErr(null);
      try {
        const [resEstado, resAulas] = await Promise.all([
          axiosMaestro.get("/api/maestro/aulas/estado-actual", { withCredentials: true }),
          axiosMaestro.get("/api/maestro/crear-aulas", { withCredentials: true }),
        ]);
        if (cancel) return;
        setEstado(resEstado.data || { liveNow: [], upcomingSoon: [], justEnded: [], nowISO: "" });
        setAulas((resAulas.data?.aulas || []).map((a) => ({ ...a, displayName: displayNameFromAula(a) })));
      } catch (e) {
        if (!cancel) setErr(e?.response?.data?.message || e.message || "Error cargando datos");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    fetchData();
    return () => { cancel = true; };
  }, []);

  // ------- Elegir primaria según reglas -------
  const primary = useMemo(() => {
    if (estado?.liveNow?.length) {
      const p = estado.liveNow[0];
      return { ...p, status: "LIVE_NOW" };
    }
    if (estado?.upcomingSoon?.length) {
      const p = estado.upcomingSoon[0];
      return { ...p, status: "UPCOMING_SOON" };
    }
    return null;
  }, [estado]);

  // ------- Mapa de estados para alternativas -------
  const estadoMap = useMemo(() => {
    const m = new Map();
    (estado.liveNow || []).forEach((e) => m.set(e.aulaId, { status: "LIVE_NOW", info: e }));
    (estado.upcomingSoon || []).forEach((e) => m.set(e.aulaId, { status: "UPCOMING_SOON", info: e }));
    (estado.justEnded || []).forEach((e) => m.set(e.aulaId, { status: "JUST_ENDED", info: e }));
    return m;
  }, [estado]);

  // ------- Alternativas (todas las aulas, menos la primaria primero) -------
  const alternatives = useMemo(() => {
    const primaryId = primary?.aulaId;
    const withStatus = aulas.map((a) => {
      const st = estadoMap.get(String(a._id));
      return { ...a, estado: st?.status || null, info: st?.info || null };
    });
    const rank = (s) => (s === "LIVE_NOW" ? 0 : s === "UPCOMING_SOON" ? 1 : s === "JUST_ENDED" ? 2 : 3);
    return withStatus
      .filter((a) => String(a._id) !== String(primaryId))
      .sort((x, y) => rank(x.estado) - rank(y.estado));
  }, [aulas, estadoMap, primary]);

  // ------- Manejar contador de la primaria -------
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!primary) {
      setCountdownMs(null);
      return;
    }
    const startMs = primary.status === "UPCOMING_SOON" ? primary.startsInMs : primary.remainingMs;
    if (startMs == null) {
      setCountdownMs(null);
      return;
    }
    setCountdownMs(startMs);
    countdownRef.current = setInterval(() => {
      setCountdownMs((prev) => (prev == null ? null : Math.max(0, prev - 1000)));
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [primary]);

  // ------- Acciones -------
  const refresh = async () => {
    try {
      setLoading(true);
      const res = await axiosMaestro.get("/api/maestro/aulas/estado-actual", { withCredentials: true });
      setEstado(res.data || { liveNow: [], upcomingSoon: [], justEnded: [], nowISO: "" });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Error actualizando estado");
    } finally {
      setLoading(false);
    }
  };

  const entrarAula = (aulaId) => {
    navigate(`/maestro/ruta2/aula/${aulaId}`);
  };

  // 👉 NUEVO: eliminar aula
  const eliminarAula = async (id) => {
    if (!window.confirm("¿Eliminar esta aula? Esta acción no se puede deshacer.")) return;
    try {
      await axiosMaestro.delete(`/api/maestro/crear-aulas/${id}`, { withCredentials: true });

      // Quitar del listado de aulas
      setAulas((prev) => prev.filter((a) => String(a._id) !== String(id)));

      // Quitar de los grupos de estado si estaba presente
      setEstado((prev) => ({
        ...prev,
        liveNow: (prev.liveNow || []).filter((x) => String(x.aulaId) !== String(id)),
        upcomingSoon: (prev.upcomingSoon || []).filter((x) => String(x.aulaId) !== String(id)),
        justEnded: (prev.justEnded || []).filter((x) => String(x.aulaId) !== String(id)),
      }));
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo eliminar el aula");
    }
  };

  const chipClass = (status) =>
    `elegirAula-chip ${status === "LIVE_NOW" ? "live" : status === "UPCOMING_SOON" ? "soon" : "ended"}`;

  // ------- Render -------
  return (
    <div className="maestro-content elegirAula-container">
      <div className="elegirAula-header">
        <h2>Elegir Aula</h2>
        <button type="button" onClick={refresh} className="elegirAula-refreshBtn">↻ Actualizar</button>
      </div>

      {loading && <div className="elegirAula-cardInfo">Cargando…</div>}
      {err && !loading && <div className="elegirAula-cardError">⚠ {err}</div>}

      {/* Card primaria */}
      {!loading && !err && primary && (
        <div className="elegirAula-primaryCard">
          <div className="elegirAula-chipRow">
            <span className={chipClass(primary.status)}>
              {primary.status === "LIVE_NOW" ? "EN CURSO" : "POR COMENZAR"}
            </span>
            {primary.grupoEtiqueta ? <span className="elegirAula-tag">{primary.grupoEtiqueta}</span> : null}
            {primary.materia ? <span className="elegirAula-tag">{primary.materia}</span> : null}
          </div>

          <h3 className="elegirAula-primaryTitle">{primary.displayName || primary.nombre || "Aula"}</h3>

          <div className="elegirAula-primaryMeta">
            {primary.tramo?.dia} • {primary.tramo?.inicio}–{primary.tramo?.fin} ({primary.tz})
          </div>

          <div className="elegirAula-primaryActions">
            {primary.status === "LIVE_NOW" && (
              <span>Termina en: <b>{msToCountdown(countdownMs)}</b></span>
            )}
            {primary.status === "UPCOMING_SOON" && (
              <span>Comienza en: <b>{msToCountdown(countdownMs)}</b></span>
            )}
            <button type="button" onClick={() => entrarAula(primary.aulaId)} className="elegirAula-btnPrimary">
              Entrar
            </button>
            {/* Si quisieras permitir borrar también la primaria, descomenta: */}
            {/* <button type="button" onClick={() => eliminarAula(primary.aulaId)} className="elegirAula-btnDanger">Eliminar</button> */}
          </div>
        </div>
      )}

      {/* Si no hay primaria, muestra indicación */}
      {!loading && !err && !primary && (
        <div className="elegirAula-cardInfo">
          No hay clase en curso ni por comenzar en la ventana configurada. Elige cualquier aula abajo.
        </div>
      )}

      {/* Alternativas */}
      {!loading && !err && (
        <div className="elegirAula-altSection">
          <h4>Otras aulas</h4>
          {alternatives.length === 0 ? (
            <div className="elegirAula-cardSoft">No hay más aulas registradas.</div>
          ) : (
            <div className="elegirAula-altGrid">
              {alternatives.map((a) => (
                <div key={a._id} className="elegirAula-altCard">
                  <div className="elegirAula-altHeader">
                    {a.estado && (
                      <span className={chipClass(a.estado)}>
                        {a.estado === "LIVE_NOW"
                          ? "EN CURSO"
                          : a.estado === "UPCOMING_SOON"
                          ? "POR COMENZAR"
                          : "RECIÉN TERMINÓ"}
                      </span>
                    )}
                    {a.grupoEtiqueta ? <span className="elegirAula-tag">{a.grupoEtiqueta}</span> : null}
                    {a.materia ? <span className="elegirAula-tag">{a.materia}</span> : null}
                  </div>

                  <div className="elegirAula-altTitle">{a.displayName}</div>

                  <div className="elegirAula-altSub">
                    {a.estado === "LIVE_NOW" && a.info?.tramo ? (
                      <>Termina a las {a.info.tramo.fin} ({a.info.tz})</>
                    ) : a.estado === "UPCOMING_SOON" && a.info?.tramo ? (
                      <>Comienza a las {a.info.tramo.inicio} ({a.info.tz})</>
                    ) : a.estado === "JUST_ENDED" && a.info?.tramo ? (
                      <>Terminó a las {a.info.tramo.fin} ({a.info.tz})</>
                    ) : (
                      <>Sin horario “ahora”.</>
                    )}
                  </div>

                  <div className="elegirAula-altActions">
                    <button
                      type="button"
                      onClick={() => entrarAula(a._id)}
                      className="elegirAula-btnSecondary"
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarAula(a._id)}
                      className="elegirAula-btnDanger"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
