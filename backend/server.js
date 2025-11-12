// backend/server.js
const { fork } = require("child_process");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv-flow");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookie = require("cookie"); // para leer cookie del handshake WS
const { COOKIE_NAMES, getTokenFromReq } = require("./utils/authCookies"); // ⬅️ NUEVO

dotenv.config();
console.log("🚀 Iniciando servidor principal...");
console.log("🌍 Ambiente:", process.env.NODE_ENV || "development");

// Ayuda a detectar errores que tumben respuestas
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

const connectDB = require("./config/db");
connectDB();

const app = express();
const server = http.createServer(app);

// 🌐 CORS dinámico (incluye defaults seguros para prod)
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,https://neteaching.com,https://www.neteaching.com,https://neteaching.onrender.com")
  .split(",")
  .map((origin) => origin.trim());

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

// ✅ Rutas
app.use("/logout", require("./routes/logout"));

// ✅ Router de login unificado con prefijo API
app.use("/api/login_unificado", require("./routes/login_unificado"));

// 🔍 Verifica token desde cookie (principal) — ahora acepta cookies por rol
app.get("/verify-token", async (req, res) => {
  const { token } = getTokenFromReq(req); // ⬅️ toma token de cualquiera de las cookies de rol
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

// 🚀 Subservidores
const subServers = [
  { path: "server_alumno.js", port: process.env.PORT_ALUMNO || 3001 },
  { path: "server_maestro.js", port: process.env.PORT_MAESTRO || 3002 },
  { path: "server_administrador.js", port: process.env.PORT_ADMINISTRADOR || 3003 },
  { path: "server_admin_principal.js", port: process.env.PORT_ADMIN_PRINCIPAL || 3004 },
];

subServers.forEach(({ path, port }) => {
  console.log(`⚡ Iniciando ${path} en puerto ${port}`);
  fork(path, [port]);
});

// 🧠 WebSockets
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

// -------- Helpers para presencia / sesión única --------
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
    console.warn(
      `⚠️ No se pudo marcar estado (${role}:${userId} -> ${estado}):`,
      e?.message || e
    );
  }
}

const socketsByUserRole = new Map(); // key: `${role}:${userId}` => Set(socketIds)
const disconnectTimers = new Map(); // key => timeoutId
const makeKey = (role, userId) => `${role}:${userId}`;
const presenceRoom = (role, userId) => `presence:${role}:${userId}`;

// ⬇️ Preferir cookie del rol indicado por el cliente (socket.handshake.auth.role)
function getWsTokenFromCookieHeader(rawCookieHeader, preferRole) {
  const cookies = cookie.parse(rawCookieHeader || "");
  // si el cliente envía el rol, intenta usar primero la cookie de ese rol
  if (preferRole && COOKIE_NAMES[preferRole] && cookies[COOKIE_NAMES[preferRole]]) {
    return cookies[COOKIE_NAMES[preferRole]];
  }
  // fallback: cualquiera de las cookies conocidas (compatibilidad)
  for (const name of Object.values(COOKIE_NAMES)) {
    if (cookies[name]) return cookies[name];
  }
  return null;
}

// 🔒 Autenticar sockets con cookies por rol (evita pateos cruzados entre roles)
io.use((socket, next) => {
  try {
    const rawCookie = socket.request.headers?.cookie || "";
    const preferRole =
      socket.handshake?.auth?.role && ["alumno", "maestro", "administrador", "admin_principal"].includes(socket.handshake.auth.role)
        ? socket.handshake.auth.role
        : null;

    const token = getWsTokenFromCookieHeader(rawCookie, preferRole);
    if (!token) return next(new Error("No token in cookie"));

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return next(new Error("Invalid token"));
    }

    const userId = decoded.userId || decoded._id || decoded.id || decoded.sub;
    const role = decoded.role;
    if (!userId || !role) return next(new Error("Token missing id/role"));

    socket.user = { userId, role, token };
    next();
  } catch (e) {
    next(new Error("Auth error"));
  }
});

// 📡 Handlers WS
io.on("connection", async (socket) => {
  console.log("🔌 Cliente WebSocket conectado");

  // -------- Presencia por usuario+rol --------
  const u = socket.user || {};
  const { userId, role } = u;
  if (!userId || !role) return socket.disconnect(true);

  const key = makeKey(role, userId);
  const prevTimer = disconnectTimers.get(key);
  if (prevTimer) {
    clearTimeout(prevTimer);
    disconnectTimers.delete(key);
  }

  if (!socketsByUserRole.has(key)) socketsByUserRole.set(key, new Set());
  const set = socketsByUserRole.get(key);
  const existingIds = [...set]; // para sesión única
  set.add(socket.id);

  // Sesión única: si hay sockets previos, los cerramos
  if (SINGLE_SESSION && existingIds.length > 0) {
    for (const sid of existingIds) {
      const s = io.sockets.sockets.get(sid);
      if (s) {
        s.emit("force-logout"); // el cliente puede limpiar UI si lo desea
        s.disconnect(true);
      }
      set.delete(sid);
    }
  }

  socket.join(presenceRoom(role, userId));

  // Si es el primer socket (o tras cerrar previos), marca conectado
  await marcarEstado(role, userId, "conectado");

  // Latidos opcionales
  socket.on("heartbeat", async () => {
    await marcarEstado(role, userId, "conectado");
  });

  // Eventos que ya tenías (sin romper compatibilidad)
  socket.on("ping", (mensaje) => {
    console.log("📡 Ping recibido:", mensaje);
    socket.emit("pong", "pong ✔");
  });

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

  // (solo logging) compara 'estado' en BD vs estado recibido (si el cliente lo manda)
  socket.on("estado_actualizado", async ({ userId: uid, role: r, statusDesdeSocket }) => {
    try {
      if (!uid || !r) return;
      const M = getUserModelByRole(r);
      const user = await M?.findById(uid);
      if (!user) return;

      const estadoMongo = user.estado; // comparamos campo 'estado'
      if (estadoMongo !== statusDesdeSocket) {
        console.log(`⚠ Estado no coincide → Mongo: ${estadoMongo}, Socket: ${statusDesdeSocket}`);
      } else {
        console.log(`✅ Estado coherente: ${estadoMongo}`);
      }
    } catch (err) {
      console.error("❌ Error al verificar estado:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente WebSocket desconectado");
    const set = socketsByUserRole.get(key);
    if (!set) return;
    set.delete(socket.id);

    if (set.size === 0) {
      // Programar desconexión con grace (recargas rápidas no marcarán desconectado)
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

// ---- Barrido periódico de presencia (TTL de latido) ----
const PRESENCE_STALE_MS = Number(process.env.PRESENCE_STALE_MS || 5 * 60 * 1000); // 5 min
const SWEEP_EVERY_MS = Number(process.env.PRESENCE_SWEEP_MS || 60 * 1000);        // 1 min
const PRESENCE_SWEEP_ENABLED = (process.env.PRESENCE_SWEEP_ENABLED || "true")
  .toLowerCase() === "true";

async function sweepStalePresence() {
  try {
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
        console.log(`🧹 Presence sweep → ${role}: ${res.modifiedCount} marcados como desconectados`);
      }
    }
  } catch (e) {
    console.warn("⚠️ Presence sweep error:", e?.message || e);
  }
}

if (PRESENCE_SWEEP_ENABLED) {
  setInterval(sweepStalePresence, SWEEP_EVERY_MS);
}

// 🛠 Error global
app.use((err, req, res, next) => {
  console.error(`❌ Error del servidor: ${err.message}`);
  res.status(500).json({ message: "Error interno del servidor" });
});

// 🚀 Inicio
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor principal escuchando en http://localhost:${PORT}`);
});
