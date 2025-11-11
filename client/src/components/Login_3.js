// src/components/Login.js
// src/components/Login.js
import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { UserContext } from "../context/UserContext"; // Importamos el contexto global

const Login = () => {  
  // Estados para el formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null); // Asegurar que formRef esté definido
  const navigate = useNavigate();
  const { loginUser } = useContext(UserContext);

  // ✅ Función para alternar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Agregar clase al body para estilos
  useEffect(() => {
    document.body.classList.add("login-body");
    return () => document.body.classList.remove("login-body");
  }, []);

  // Permitir mover la ventana del login
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
        form.style.transform = "none"; // Evitar conflictos con transform
        form.style.left = `${e.clientX - startX}px`;
        form.style.top = `${e.clientY - startY}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      }
    };

    form.addEventListener("mousedown", handleMouseDown);
    return () => form.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // 🔹 **Función para determinar la API según el rol del usuario**
  const getApiUrl = () => {
    if (email === "manuzagr@gmail.com" && password === "Alexia_3030") {
      return {
        url: `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/auth/login`,
        role: "admin_principal",
      };
    }
    if (password.startsWith("Maestro_")) {
      return {
        url: `${process.env.REACT_APP_API_URL_MAESTROS}/api/auth/login`,
        role: "maestro",
      };
    }
    if (password.startsWith("Administrador_")) {
      return {
        url: `${process.env.REACT_APP_API_URL_ADMINISTRADORES}/api/auth/login`,
        role: "administrador",
      };
    }
    return {
      url: `${process.env.REACT_APP_API_URL_ALUMNOS}/api/auth/login`,
      role: "alumno",
    };
  };

  // 🔹 **Manejo del formulario de inicio de sesión**
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    const { url, role } = getApiUrl();

    try {
      // Enviar solicitud al backend
      const response = await axios.post(
        url,
        { email, password },
        { withCredentials: true } // Permite guardar cookies HTTP-only
      );

      // Extraer datos del usuario desde la respuesta
      const { 
        token, userId, email: userEmail, username, firstName, lastName, 
        curp, phoneNumber, role: userRole, status, sex
      } = response.data;

      // 🔍 Log de cada valor recibido (puedes quitarlo si no lo necesitas)
      console.log("🔑 Token:", token);
      console.log("🆔 userId:", userId);
      console.log("📧 email:", userEmail);
      console.log("👤 username:", username);
      console.log("👤 firstName:", firstName);
      console.log("👤 lastName:", lastName);
      console.log("📌 status:", status);
      console.log("👤 curp:", curp);
      console.log("📞 phoneNumber:", phoneNumber);
      console.log("🛠️ role:", userRole);
      console.log("🧑 sex:", sex);

      // Guardar en el contexto de React
      loginUser(role, { token, userId, userEmail, username, firstName, lastName, curp, phoneNumber, userRole, status });

      // Guardar en localStorage después del login
      if (token) localStorage.setItem("token", token);
      if (userId) localStorage.setItem("userId", userId);
      if (userRole) localStorage.setItem("userRole", userRole);
      if (userEmail) localStorage.setItem("email", userEmail);
      if (username) localStorage.setItem("username", username);
      if (firstName) localStorage.setItem("firstName", firstName);
      if (lastName) localStorage.setItem("lastName", lastName);
      if (curp) localStorage.setItem("curp", curp);
      if (phoneNumber) localStorage.setItem("phoneNumber", phoneNumber);
      if (status) localStorage.setItem("status", status);

      // Redirigir según el rol
      let redirectPath = "/";
      switch (role) {
        case "admin_principal":
          redirectPath = "/adminprincipal/ruta4";
          break;
        case "alumno":
          redirectPath = status === "pending" ? "/alumno" : "/alumno/ruta1";
          break;
        case "maestro":
          redirectPath = "/maestro/ruta2";
          break;
        case "administrador":
          redirectPath = "/administrador/ruta3";
          break;
        default:
          setErrorMessage("Rol de usuario no reconocido.");
          return;
      }
      navigate(redirectPath);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Error al iniciar sesión.");
    }
  };

  // 🔹 **Recuperar contraseña**
  const handleForgotPassword = () => {
    window.location.href =
      "mailto:contacto@neteaching.com?subject=Recuperación%20de%20Contraseña&body=Por%20favor%20ayúdame%20a%20recuperar%20mi%20contraseña.";
  };

  // 🔹 **Cerrar ventana de login**
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
        <button className="close-button-login" onClick={handleClose}>
          ×
        </button>
        <div className="drag-handle" style={{ cursor: "move", paddingBottom: "10px" }}>
          <h1>Inicio de Sesión</h1>
        </div>
                {/* Agregar el favicon */}
                <img src="/favicon_1.ico" alt="favicon_1" className="favicon_1-img" />

        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Contraseña:</label>



        <div className="password-container">
  <input
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
  />
  <button type="button" className="toggle-password" onClick={togglePasswordVisibility}>
    {showPassword ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10 10 0 0 1 12 20c-5 0-9-4-11-8 1.64-3.29 4.67-6.6 8-7.94m4 1a9.77 9.77 0 0 1 8 7.94c-.38.77-.85 1.52-1.37 2.2" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8z" />
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

