// 📁 JitsiMeet.js
// client/src/components/alumno/ruta1/acceso/aula_virtual/JitsiMeet.js
import React, { useEffect, useRef } from "react";

/** Carga el script de Jitsi si no existe */
function ensureJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://meet.jit.si/external_api.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar external_api.js"));
    document.head.appendChild(s);
  });
}

/**
 * Embed de Jitsi:
 * - Ocultamos la toolbar de Jitsi para usar nuestra barra de controles propia.
 * - Llama onReady() cuando el usuario entra a la sala.
 */
const JitsiMeet = ({ roomName = "AulaNeteaching", displayName = "Usuario Neteaching", onReady }) => {
  const parentRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const mount = async () => {
      await ensureJitsiScript();
      if (cancelled) return;

      // Limpieza si hubiera instancia previa
      try { apiRef.current?.dispose?.(); } catch {}

      const domain = "meet.jit.si";
      const options = {
        roomName,
        parentNode: parentRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],              // sin toolbar de Jitsi
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      api.addEventListener("videoConferenceJoined", () => onReady?.());
    };

    mount().catch(console.error);
    return () => {
      cancelled = true;
      try { apiRef.current?.dispose(); } catch {}
    };
  }, [roomName, displayName, onReady]);

  return <div ref={parentRef} className="jitsi-embed" style={{ width: "100%", height: "100%" }} />;
};

export default JitsiMeet;
