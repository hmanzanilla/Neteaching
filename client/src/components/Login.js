// src/components/Login.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { UserContext } from "../context/UserContext";

// ✅ Usa la instancia ya configurada (baseURL + withCredentials)
import axiosPrincipal from "../axiosConfig/axiosPrincipal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);

  useEffect(() => {
    document.body.classList.add("login-body");
    return () => document.body.classList.remove("login-body");
  }, []);

  useEffect(() => {
    const form = formRef.current;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e) => {
      if (e.target.closest(".drag-handle")) {
        isDragging = true;
        startX = e.clientX - form.offsetLeft;
        startY = e.clientY - form.offsetTop;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        form.style.transform = "none";
        form.style.left = `${e.clientX - startX}px`;
        form.style.top = `${e.clientY - startY}px`;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    form.addEventListener("mousedown", handleMouseDown);
    return () => form.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await axiosPrincipal.post("/api/login_unificado", {
        email: email.trim(),
        password: password.trim(),
      });

      const { user, role, redirectUrl } = response.data;

      // 🔐 Guardamos usuario y rol en el contexto
      loginUser(user, role);

      // 🔁 Redirigir según el rol
      navigate(redirectUrl);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || "Error al iniciar sesión."
      );
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPassword = () => {
    window.location.href =
      "mailto:contacto@neteaching.com?subject=Recuperación%20de%20Contraseña&body=Por%20favor%20ayúdame%20a%20recuperar%20mi%20contraseña.";
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="login-container">
      <form
        onSubmit={handleSubmit}
        className="login-form"
        ref={formRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <button className="close-button-login" onClick={handleClose}>
          ×
        </button>
        <div
          className="drag-handle"
          style={{ cursor: "move", paddingBottom: "10px" }}
        >
          <h1>Inicio de Sesión</h1>
        </div>

        <img src="/favicon_1.ico" alt="favicon_1" className="favicon_1-img" />

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña:</label>
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        </div>

        <button type="submit">Iniciar Sesión</button>
        {errorMessage && <p className="error">{errorMessage}</p>}

        <button
          type="button"
          className="forgot-password"
          onClick={handleForgotPassword}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
};

export default Login;
