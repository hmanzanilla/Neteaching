// 📁 src/components/alumno/ruta1/conocenos/suscribete/Suscribete.js

import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../../../context/UserContext";
import axiosAlumno from "../../../../../axiosConfig/axiosAlumno";
import "./Suscribete.css";

const Suscribete = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  const userId = userData?._id;

  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState("Tarjeta");
  const [estadoSuscripcion, setEstadoSuscripcion] = useState(null);
  const [cargando, setCargando] = useState(true);

  const paquetes = [
    { id: 1, nombre: "Básico", precio: 350, duracion: "1 mes" },
    { id: 2, nombre: "Intermedio", precio: 1000, duracion: "3 meses" },
    { id: 3, nombre: "Premium", precio: 3000, duracion: "1 año" },
  ];

  useEffect(() => {
    if (userId) verificarEstadoSuscripcion();
  }, [userId]);

  const verificarEstadoSuscripcion = async () => {
    try {
      const response = await axiosAlumno.get(`/api/suscripcion/verificar/${userId}`);
      setEstadoSuscripcion(response.data);
    } catch (error) {
      console.error("❌ Error al verificar suscripción:", error);
      setEstadoSuscripcion(null);
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarPaquete = (paquete) => {
    setPaqueteSeleccionado(paquete);
  };

  const handleSubscription = async () => {
    if (!paqueteSeleccionado) {
      alert("⚠ Selecciona un paquete antes de continuar.");
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas suscribirte al paquete "${paqueteSeleccionado.nombre}" por $${paqueteSeleccionado.precio} MXN usando ${metodoPago}?`
    );

    if (!confirmar) return;

    try {
      const response = await axiosAlumno.post(
        "/api/suscripcion",
        {
          userId,
          paquete: paqueteSeleccionado.nombre,
          monto: paqueteSeleccionado.precio,
          metodo_pago: metodoPago,
        }
      );

      if (response.status === 200) {
        alert("✅ ¡Suscripción completada con éxito!");
        setEstadoSuscripcion({ suscrito: true, fecha_fin: response.data.fecha_fin });
        navigate("/alumno/acceso");
      } else {
        alert("❌ Error al procesar la suscripción.");
      }
    } catch (error) {
      console.error("❌ Error al suscribirse:", error);
      alert("Hubo un error al procesar la suscripción. Inténtalo nuevamente.");
    }
  };

  return (
    <section className="suscribete-container">
      <h1>Suscripción a Neteaching</h1>

      {cargando ? (
        <p>⏳ Cargando estado de suscripción...</p>
      ) : estadoSuscripcion?.suscrito ? (
        <p>✅ Tu suscripción está activa hasta el {estadoSuscripcion.fecha_fin}.</p>
      ) : (
        <>
          <p>Selecciona un paquete para suscribirte:</p>

          <div className="paquetes">
            {paquetes.map((paquete) => (
              <button
                key={paquete.id}
                className={paqueteSeleccionado?.id === paquete.id ? "seleccionado" : ""}
                onClick={() => handleSeleccionarPaquete(paquete)}
              >
                {paquete.nombre} - ${paquete.precio} MXN ({paquete.duracion})
              </button>
            ))}
          </div>

          <p>Selecciona el método de pago:</p>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="Tarjeta">Tarjeta</option>
            <option value="PayPal">PayPal</option>
            <option value="Transferencia">Transferencia</option>
          </select>

          <button onClick={handleSubscription} disabled={!paqueteSeleccionado}>
            Confirmar suscripción
          </button>
        </>
      )}

      <button onClick={() => navigate("/alumno")}>Regresar</button>
    </section>
  );
};

export default Suscribete;