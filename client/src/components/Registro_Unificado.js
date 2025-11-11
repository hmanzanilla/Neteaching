// src/components/Registro_Unificado.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Registro_Unificado.css";

const Registro_Unificado = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    curp: "",
    phoneNumber: "",
    sex: "",
  });

  const [showPwd, setShowPwd] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // ---- Drag (aplicado SOLO a la franja azul) ----
  const formRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0 });

  // Fondo especial en body solo en esta página
  useEffect(() => {
    document.body.classList.add("register-body");
    return () => document.body.classList.remove("register-body");
  }, []);

  const getApiUrl = () => {
    if (formData.password.startsWith("Maestro_"))
      return process.env.REACT_APP_API_URL_MAESTROS;
    if (formData.password.startsWith("Administrador_"))
      return process.env.REACT_APP_API_URL_ADMINISTRADORES;
    return process.env.REACT_APP_API_URL_ALUMNOS;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "curp" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const required = [
      "email",
      "password",
      "username",
      "firstName",
      "lastName",
      "curp",
      "phoneNumber",
      "sex",
    ];
    if (required.some((k) => !formData[k])) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setErrorMessage("Error interno: No se pudo determinar la API.");
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/register`, formData);
      setSuccessMessage("Registro exitoso. Ahora inicie sesión manualmente.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Error en el registro. Inténtelo de nuevo más tarde."
      );
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      password: "",
      username: "",
      firstName: "",
      lastName: "",
      curp: "",
      phoneNumber: "",
      sex: "",
    });
    setErrorMessage("");
    setSuccessMessage("");
    navigate("/");
  };

  // ---- Drag helpers (con límites para que no “se pierda”) ----
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const getClampBounds = () => {
    const el = formRef.current;
    if (!el) return { minX: -300, maxX: 300, minY: -200, maxY: 200 };

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 24;

    const halfW = Math.min(rect.width, vw) / 2 + margin;
    const halfH = Math.min(rect.height, vh) / 2 + margin;

    return {
      minX: -((vw / 2) - halfW),
      maxX: (vw / 2) - halfW,
      minY: -((vh / 2) - halfH),
      maxY: (vh / 2) - halfH,
    };
  };

  const onDragMove = useCallback((clientX, clientY) => {
    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;

    const { minX, maxX, minY, maxY } = getClampBounds();
    setPos((prev) => ({
      x: clamp(prev.x + dx, minX, maxX),
      y: clamp(prev.y + dy, minY, maxY),
    }));

    startRef.current = { x: clientX, y: clientY };
  }, []);

  // Mouse
  const onMouseDown = (e) => {
    // si el click fue sobre el botón cerrar, no iniciar drag
    if (e.target.closest?.(".register-close")) return;
    setIsDragging(true);
    document.body.classList.add("dragging-register");
    startRef.current = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    onDragMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove("dragging-register");
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Touch
  const onTouchStart = (e) => {
    const t = e.touches[0];
    // si tocó el botón cerrar, no iniciar drag
    if (e.target.closest?.(".register-close")) return;
    setIsDragging(true);
    document.body.classList.add("dragging-register");
    startRef.current = { x: t.clientX, y: t.clientY };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  };
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
    e.preventDefault();
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    document.body.classList.remove("dragging-register");
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
  };

  return (
    <div className="register-overlay">
      <div className="register-container">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="register-form"
          role="form"
          aria-labelledby="titulo-registro"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        >
          {/* Franja AZUL (drag only) */}
          <div
            className="register-drag-strip"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            aria-label="Arrastrar formulario"
            aria-grabbed={isDragging}
          >
            <button
              type="button"
              className="register-close"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={handleClose}
              aria-label="Cerrar registro"
              title="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Título */}
          <div className="drag-handle-register">
            <h1 id="titulo-registro">Registro de Usuario</h1>
          </div>

          {errorMessage && (
            <p className="error-message" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="success-message" role="status">
              {successMessage}
            </p>
          )}

          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Contraseña:</label>
          <div className="input-with-toggle">
            <input
              type={showPwd ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar contraseña" : "Ver contraseña"}
              title={showPwd ? "Ocultar" : "Ver"}
            >
              {showPwd ? "Ocultar" : "Ver"}
            </button>
          </div>

          <label>Nombre de usuario:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Nombre(s):</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />

          <label>Apellidos:</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />

          <label>CURP:</label>
          <input
            type="text"
            name="curp"
            value={formData.curp}
            onChange={handleChange}
            required
            inputMode="text"
          />

          <label>Número de teléfono:</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            inputMode="tel"
          />

          <label>Sexo:</label>
          <select name="sex" value={formData.sex} onChange={handleChange} required>
            <option value="">Selecciona una opción</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>

          <button type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
};

export default Registro_Unificado;
