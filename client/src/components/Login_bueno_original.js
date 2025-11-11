// src/components/Login.js
// src/components/Login.js
import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { UserContext } from "../context/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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

  const getApiUrl = () => {
    if (email === "manuzagr@gmail.com" && password === "Alexia_3030") {
      return { url: `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/auth/login`, role: "admin_principal" };
    }
    if (password.startsWith("Maestro_")) {
      return { url: `${process.env.REACT_APP_API_URL_MAESTROS}/api/auth/login`, role: "maestro" };
    }
    if (password.startsWith("Administrador_")) {
      return { url: `${process.env.REACT_APP_API_URL_ADMINISTRADORES}/api/auth/login`, role: "administrador" };
    }
    return { url: `${process.env.REACT_APP_API_URL_ALUMNOS}/api/auth/login`, role: "alumno" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { url, role } = getApiUrl();

    try {
      const response = await axios.post(
        url,
        { email, password },
        { withCredentials: true }
      );

      const { redirectUrl, sessionToken, ...userData } = response.data;

      console.log("🔑 Datos recibidos del backend:", userData);
      loginUser(role, sessionToken);

      navigate(redirectUrl);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Error al iniciar sesión.");
    }
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
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <button className="close-button-login" onClick={handleClose}> × </button>
        <div className="drag-handle" style={{ cursor: "move", paddingBottom: "10px" }}>
          <h1>Inicio de Sesión</h1>
        </div>

        <img src="/favicon_1.ico" alt="favicon_1" className="favicon_1-img" />

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Contraseña:</label>
        <div className="password-container">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" className="toggle-password" onClick={togglePasswordVisibility}>
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10 10 0 0 1 12 20c-5 0-9-4-11-8 1.64-3.29 4.67-6.6 8-7.94m4 1a9.77 9.77 0 0 1 8 7.94c-.38.77-.85 1.52-1.37 2.2" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  );
};

export default Login;
