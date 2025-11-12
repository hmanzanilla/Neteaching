// backend/server.js
// 🌐 Servidor principal unificado (alumno, maestro, administrador, admin_principal)

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv-flow");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookie = require("cookie");
const { COOKIE_NAMES, getTokenFromReq } = require("./utils/authCookies");
const connectDB = require("./config/db");

dotenv.config();

console.log("🚀 Iniciando servidor principal...");
console.log("🌍 Ambiente:", process.env.NODE_ENV || "development");

// ⚠️ Manejo global de errores
process.on("unhandledRejection", (reason) => console.error("UNHANDLED REJECTION:", reason));
process.on("uncaughtException", (err) => console.error("UNCAUGHT EXCEPTION:", err));

// ✅ Conexión a la base de datos
connectDB();

const app = express();
const server = http.createServer(app);

// 🌐 Configuración CORS dinámica
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,https://neteaching.com,https://www.neteaching.com,https://neteaching.onrender.com")
  .split(",")
  .map((o) => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(cookieParser());

// ✅ Rutas generales
app.use("/logout", require("./routes/logout"));
app.use("/api/login_unificado", require("./routes/login_unificado"));

// ✅ Montaje de los routers por rol
try {
  app.use("/api/alumno", require("./routes/routers/router_alumno"));
  app.use("/api/maestro", require("./routes/routers/router_maestro"));
  app.use("/api/administrador", require("./routes/routers/router_administrador"));
  app.use("/api/admin_principal", require("./routes/routers/router_admin_principal"));
  console.log("✅ Routers de roles montados correctamente.");
} catch (e) {
  console.error("❌ Error al montar routers:", e.message);
}

// 🔍 Verificación unificada de token
app.get("/verify-token", async (req, res) => {
  const { token } = getTokenFromReq(req);
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, role } = decoded;

    const modelMap = {
      alumno: require("./models/User_alumno"),
      maestro: require("./models/User_maestro"),
      administrador: require("./models/User_admin"),
      admin_principal: require("./models/User_admin_principal"),
    };

    const UserModel = modelMap[role];
    if (!UserModel)
      return res.status(400).json({ message: `Modelo no encontrado para rol: ${role}` });

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    return res.status(200).json({
      message: "Token válido",
      user: {
        email: user.email,
        role: user.role,
        estado: user.estado || "desconectado",
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Token inválido", error: error.message });
  }
});

// 🧠 WebSockets — control de sesiones y presencia
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

const SINGLE_SESSION = (process.env.SINGLE_SESSION || "true").toLowerCase() === "true";
const GRACE_MS = Number(process.env.PRESENCE_GRACE_MS || 8000);

const getUserModelByRole = (role) =>
  ({
    alumno: require("./models/User_alumno"),
    maestro: require("./models/User_maestro"),
    administrador: require("./models/User_admin"),
    admin_principal: require("./models/User_admin_principal"),
  }[role]);

async function marcarEstado(role, userId, estado) {
  try {
    const M = getUserModelByRole(role);
    if (!M) return;
    await M.findByIdAndUpdate(
      userId,
      { $set: { estado, lastSeenAt: new Date() } },
      { new: true }
    );
  } catch (e) {
    console.warn(`⚠️ No se pudo marcar estado (${role}:${userId} -> ${estado}):`, e?.message || e);
  }
}

const socketsByUserRole = new Map();
const disconnectTimers = new Map();
const makeKey = (role, userId) => `${role}:${userId}`;
const presenceRoom = (role, userId) => `presence:${role}:${userId}`;

function getWsTokenFromCookieHeader(rawCookieHeader, preferRole) {
  const cookies = cookie.parse(rawCookieHeader || "");
  if (preferRole && COOKIE_NAMES[preferRole] && cookies[COOKIE_NAMES[preferRole]]) {
    return cookies[COOKIE_NAMES[preferRole]];
  }
  for (const name of Object.values(COOKIE_NAMES)) {
    if (cookies[name]) return cookies[name];
  }
  return null;
}

io.use((socket, next) => {
  try {
    const rawCookie = socket.request.headers?.cookie || "";
    const preferRole =
      socket.handshake?.auth?.role &&
      ["alumno", "maestro", "administrador", "admin_principal"].includes(socket.handshake.auth.role)
        ? socket.handshake.auth.role
        : null;

    const token = getWsTokenFromCookieHeader(rawCookie, preferRole);
    if (!token) return next(new Error("No token in cookie"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded._id || decoded.id || decoded.sub;
    const role = decoded.role;
    if (!userId || !role) return next(new Error("Token missing id/role"));

    socket.user = { userId, role, token };
    next();
  } catch (e) {
    next(new Error("Auth error"));
  }
});

io.on("connection", async (socket) => {
  console.log("🔌 Cliente WebSocket conectado");

  const { userId, role } = socket.user || {};
  if (!userId || !role) return socket.disconnect(true);

  const key = makeKey(role, userId);
  const prevTimer = disconnectTimers.get(key);
  if (prevTimer) {
    clearTimeout(prevTimer);
    disconnectTimers.delete(key);
  }

  if (!socketsByUserRole.has(key)) socketsByUserRole.set(key, new Set());
  const set = socketsByUserRole.get(key);
  const existingIds = [...set];
  set.add(socket.id);

  if (SINGLE_SESSION && existingIds.length > 0) {
    for (const sid of existingIds) {
      const s = io.sockets.sockets.get(sid);
      if (s) {
        s.emit("force-logout");
        s.disconnect(true);
      }
      set.delete(sid);
    }
  }

  socket.join(presenceRoom(role, userId));
  await marcarEstado(role, userId, "conectado");

  socket.on("heartbeat", async () => await marcarEstado(role, userId, "conectado"));
  socket.on("ping", (msg) => socket.emit("pong", "pong ✔"));

  socket.on("joinRoom", ({ room, user }) => {
    socket.join(room);
    io.to(room).emit("userJoined", { user });
  });

  socket.on("message", ({ room, user, text }) => {
    io.to(room).emit("message", { user, text });
  });

  socket.on("draw", ({ room, data }) => {
    io.to(room).emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente WebSocket desconectado");
    const set = socketsByUserRole.get(key);
    if (!set) return;
    set.delete(socket.id);

    if (set.size === 0) {
      const timeoutId = setTimeout(async () => {
        const still = socketsByUserRole.get(key);
        if (!still || still.size === 0) {
          await marcarEstado(role, userId, "desconectado");
          socketsByUserRole.delete(key);
        }
        disconnectTimers.delete(key);
      }, GRACE_MS);
      disconnectTimers.set(key, timeoutId);
    }
  });
});

// 🧹 Limpieza de presencia inactiva
const PRESENCE_STALE_MS = Number(process.env.PRESENCE_STALE_MS || 5 * 60 * 1000);
const SWEEP_EVERY_MS = Number(process.env.PRESENCE_SWEEP_MS || 60 * 1000);

setInterval(async () => {
  const cutoff = new Date(Date.now() - PRESENCE_STALE_MS);
  const roles = ["alumno", "maestro", "administrador", "admin_principal"];

  for (const role of roles) {
    const M = getUserModelByRole(role);
    if (!M) continue;
    const res = await M.updateMany(
      { estado: "conectado", lastSeenAt: { $lt: cutoff } },
      { $set: { estado: "desconectado" } }
    );
    if (res.modifiedCount) {
      console.log(`🧹 Presence sweep → ${role}: ${res.modifiedCount} desconectados`);
    }
  }
}, SWEEP_EVERY_MS);

// 🛠 Error global
app.use((err, req, res, next) => {
  console.error(`❌ Error del servidor: ${err.message}`);
  res.status(500).json({ message: "Error interno del servidor" });
});

// 🚀 Inicio
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Servidor escuchando en http://localhost:${PORT}`));


