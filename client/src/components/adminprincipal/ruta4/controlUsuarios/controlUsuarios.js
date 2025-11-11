// client/src/components/adminprincipal/ruta4/controlUsuarios/controlUsuarios.js
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../../context/UserContext";
import axiosAdmin from "../../../../axiosConfig/axiosAdmin";

// Helper: garantiza que siempre usemos /api/...
const api = (path) => `/api${path.startsWith("/") ? path : `/${path}`}`;

const Ruta4 = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();

  const { userData, isAuthenticated, loading, logoutUser } = useContext(UserContext);

  useEffect(() => {
    // DEBUG: confirma el baseURL real que está usando axios
    console.log("[ControlUsuarios] axiosAdmin.baseURL =", axiosAdmin?.defaults?.baseURL);
  }, []);

  useEffect(() => {
    if (loading) return;

    const role = (userData?.role || userData?.user?.role || "").trim().toLowerCase();
    if (!isAuthenticated || !userData || role !== "admin_principal") {
      console.warn("🚨 No autorizado. Redirigiendo a login…");
      logoutUser();
      return;
    }

    const fetchUsers = async () => {
      try {
        const url = api("/users");
        console.log("[GET]", url);
        const { data } = await axiosAdmin.get(url, { withCredentials: true });
        setUsers(data || []);
        setError("");
      } catch (err) {
        handleError(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [loading, isAuthenticated, userData, logoutUser]);

  const handleError = (error) => {
    console.error("❌ [handleError]:", error?.response?.status, error?.message);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      logoutUser();
    } else {
      setError("Error al obtener la lista de usuarios");
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      const url = api(`/status/${userId}`);
      console.log("[PUT]", url);
      await axiosAdmin.put(url, { status: newStatus }, { withCredentials: true });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u)));
    } catch (err) {
      console.error("❌ [updateUserStatus] Error:", err);
      setError("Error al actualizar usuario");
    }
  };

  const handleDelete = async (userId) => {
    try {
      const u = users.find((x) => x._id === userId);
      if (u?.role === "admin_principal") {
        setError("⚠ No se puede eliminar al administrador principal.");
        return;
      }
      const url = api(`/delete/${userId}`);
      console.log("[DELETE]", url);
      await axiosAdmin.delete(url, { withCredentials: true });
      setUsers((prev) => prev.filter((x) => x._id !== userId));
    } catch (err) {
      console.error("❌ [handleDelete] Error:", err);
      setError("Error al eliminar usuario");
    }
  };

  if (loadingUsers || loading) return <div>Cargando...</div>;

  return (
    <div style={{ textAlign: "center", marginTop: "40px", width: "90%", margin: "auto" }}>
      <h2 style={{ color: "orange" }}>
        {userData?.sex === "Masculino" ? "Bienvenido" : "Bienvenida"} {userData?.firstName} {userData?.lastName}
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
          <tr style={{ backgroundColor: "#f2f2f2", borderBottom: "2px solid black" }}>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Sexo</th>
            <th>Email</th>
            <th>Username</th>
            <th>Status</th>
            <th>Role</th>
            <th>Acciones</th>
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
                <td>
                  {user.role === "admin_principal" ? (
                    <span style={{ color: "blue", fontWeight: "bold" }}>active</span>
                  ) : (
                    <button
                      onClick={() =>
                        updateUserStatus(user._id, user.status === "pending" ? "active" : "pending")
                      }
                      style={{ backgroundColor: user.status === "pending" ? "red" : "blue", color: "white" }}
                    >
                      {user.status}
                    </button>
                  )}
                </td>
                <td>{user.role}</td>
                <td>
                  {user.role !== "admin_principal" && (
                    <button
                      onClick={() => handleDelete(user._id)}
                      style={{ backgroundColor: "black", color: "white" }}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Ruta4;