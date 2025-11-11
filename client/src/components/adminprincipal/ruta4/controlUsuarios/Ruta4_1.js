// client/src/components/adminprincipal/ruta4/controlUsuario/Ruta4_1.js
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";

const Ruta4 = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userData, isAuthenticated, loginUser, setUserId } = useContext(UserContext);

  // 🔹 Punto 1: Mensaje de bienvenida dinámico
  const getWelcomeMessage = () => {
    if (!userData) return "";
    return userData.sex === "Masculino" ? "Bienvenido" : "Bienvenida";
  };

  useEffect(() => {
    const verifyTokenAndFetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");

        // 🔹 Punto 2: Verificar autenticación y evitar bucles
        if (!token || userRole !== "admin_principal") {
          handleLogout();
          return;
        }

        // 🔹 Punto 3: Verifica el token solo una vez
        const verifyResponse = await axios.get(
          `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/admin_principal/auth/verify-token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!verifyResponse.data.valid) {
          handleLogout();
          return;
        }

        const { userId } = verifyResponse.data.user;
        if (userId !== localStorage.getItem("userId")) {
          localStorage.setItem("userId", userId);
          setUserId(userId);
        }

        // 🔹 Punto 4: Obtiene usuarios solo si el token es válido
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/admin_principal/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(response.data || []);
        setError("");
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      verifyTokenAndFetchUsers();
    }
  }, [isAuthenticated]); // 🔹 Se ejecuta solo cuando cambia el estado de autenticación

  const handleError = (error) => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        handleLogout();
      } else {
        setError("Error al obtener la lista de usuarios");
      }
    } else {
      setError("No se pudo conectar con el servidor");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    loginUser(null, null);
    setUserId(null);
    navigate("/login");
  };

  // 🔹 Punto 5: Cambio de estado de usuario
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay token de autenticación. Por favor, inicia sesión nuevamente.");
        navigate("/login");
        return;
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/admin_principal/status/${userId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (error) {
      setError("Error al actualizar usuario");
    }
  };

  // 🔹 Punto 6: Eliminar usuario excepto admin_principal
  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const userToDelete = users.find((user) => user._id === userId);

      if (!token) {
        setError("⚠ No hay token de autenticación. Inicia sesión nuevamente.");
        return;
      }

      if (userToDelete && userToDelete.role === "admin_principal") {
        setError("⚠ No se puede eliminar al administrador principal.");
        return;
      }

      await axios.delete(
        `${process.env.REACT_APP_API_URL_ADMIN_PRINCIPAL}/api/admin_principal/delete/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
    } catch (error) {
      setError("Error al eliminar usuario");
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "40px", width: "90%", margin: "auto" }}>
      {/* 🔹 Punto 1: Mensaje de bienvenida dinámico */}
      <h2 style={{ color: "orange" }}>
        {getWelcomeMessage()} {userData?.firstName} {userData?.lastName}
      </h2>
      <h1 style={{ color: "blue" }}>Panel del Administrador Principal</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table
        style={{
          margin: "20px auto",
          width: "80%",
          borderCollapse: "collapse",
          border: "1px solid black",
        }}
      >
        <thead>
          {/* 🔹 Punto 7: Tabla con divisiones visibles */}
          <tr style={{ backgroundColor: "#f2f2f2", textAlign: "left", borderBottom: "2px solid black" }}>
            <th style={{ border: "1px solid black", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Apellido</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Sexo</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Email</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Username</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Status</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Role</th>
            <th style={{ border: "1px solid black", padding: "8px" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id}>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.sex}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                {/* 🔹 Punto 8: Botón para cambiar estado */}
                <td>
                  <button
                    onClick={() => updateUserStatus(user._id, user.status === "pending" ? "active" : "pending")}
                    style={{ backgroundColor: user.status === "pending" ? "red" : "blue", color: "white" }}
                  >
                    {user.status}
                  </button>
                </td>
                <td>{user.role}</td>
                {/* 🔹 Punto 9: Botón de eliminación */}
                <td>
                  {user.role !== "admin_principal" && (
                    <button onClick={() => handleDelete(user._id)} style={{ backgroundColor: "black", color: "white" }}>
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="8">No hay usuarios registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Ruta4;
