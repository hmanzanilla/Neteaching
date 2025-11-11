// backend/server_administrador.js
// 🚀 SUBSERVIDOR: Administrador (con logging de diagnóstico)

const dotenv = require("dotenv-flow");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const winston = require("winston");
const path = require("path");
const connectDB = require("./config/db");

// —— Captura de errores globales para ver crasheos ocultos
process.on("unhandledRejection", (reason) => {
  console.error("🧨 UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🧨 UNCAUGHT EXCEPTION:", err);
});

console.log(`🌍 Cargando configuración desde ${process.env.NODE_ENV || "development"}`);

// ✅ Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "server_administrador.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

logger.info("🚀 Iniciando subservidor del Administrador...");

const app = express();
const PORT = Number(process.env.PORT_ADMINISTRADOR || 3003);
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

let DB_READY = false;

// ✅ Conexión a MongoDB + saneo de sesiones al iniciar (solo rol "administrador")
(async () => {
  try {
    await connectDB();
    DB_READY = true;
    logger.info("🗄️  Conectado a MongoDB (admin)");
    try {
      const shouldReset =
        (process.env.RESET_SESSIONS_ON_BOOT || "true").toLowerCase() === "true";
      if (shouldReset) {
        const User = require("./models/User"); // modelo base c/ discriminador
        await User.resetSessionsOnBoot("administrador");
        logger.info("🧹 Sesiones saneadas para rol 'administrador' al iniciar.");
      } else {
        logger.info("↪️ RESET_SESSIONS_ON_BOOT=false → no se sanean sesiones en arranque (administrador).");
      }
    } catch (e) {
      logger.warn(`⚠️ No se pudo sanear sesiones al inicio (administrador): ${e?.message || e}`);
    }
  } catch (e) {
    logger.error(`❌ Error conectando a BD: ${e?.message || e}`);
  }
})();

// ✅ CORS dinámico con credenciales (cookies httpOnly)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

logger.info(`🔏 CORS allowedOrigins: ${JSON.stringify(allowedOrigins)}`);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`❌ Origen no permitido por CORS: ${origin}`);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"],
  })
);

// ✅ Middlewares esenciales
app.use(express.json());
app.use(cookieParser());

// 🔎 Mini-logger por request (método, url, status y tiempo)
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - t0;
    logger.info(`➡️  ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ✅ Archivos estáticos (si compartes uploads entre roles)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ——— helper: montar rutas con try/catch y logs
function safeMount(mountPath, routerPath) {
  try {
    app.use(mountPath, require(routerPath));
    logger.info(`✅ Montado ${mountPath} -> ${routerPath}`);
  } catch (e) {
    logger.error(`❌ No se pudo montar ${mountPath} desde ${routerPath}: ${e?.message || e}`);
  }
}

// -------------------------------------------------------------------
// 📌 Rutas API del ADMINISTRADOR (clon de Maestro con rutas físicas nuevas)
// -------------------------------------------------------------------

// 🔐 Auth del administrador (verify-token, login, logout interno, etc.)
safeMount("/api/administrador/auth", "./routes/administrador/auth_administrador");

// 🗂️ Crear Aulas (endpoints de creación y configuración inicial)
safeMount("/api/administrador/crear-aulas", "./routes/administrador/crear_aulas");

// 📡 Estado actual de aulas (en curso / por comenzar / recién terminadas)
safeMount("/api/administrador/aulas", "./routes/administrador/aulas_estado");

// 🟢 Estado de conexión (expuesto como /api/administrador/marcar-conectado)
safeMount("/api/administrador", "./routes/marcarConectado");

// ✅ Alias retrocompatible para llamadas viejas a "/marcar-conectado"
safeMount("/", "./routes/marcarConectado");

// 📝 Registro (común si lo usas para crear usuarios desde admin)
safeMount("/api/register", "./routes/register");

// 📷 Perfil / uploads compartidos (si aplica al admin)
safeMount("/api/perfil", "./routes/general/fotosPerfil");

// 📚 Lectura de grupos/horarios (si admin también consume estos)
safeMount("/api/grupos", "./routes/general/leerGruposHorarios");

// 🔎 Alias conveniente: /verify-token → /api/administrador/auth/verify-token
// (307 mantiene método/headers/cookies)
app.get("/verify-token", (req, res) => {
  logger.info("↪️  /verify-token → 307 /api/administrador/auth/verify-token");
  res.redirect(307, "/api/administrador/auth/verify-token");
});

// 🔁 Logout simple (compatibilidad con front que postea a /logout)
safeMount("/logout", "./routes/logout");

// ✅ Health / readiness
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, role: "administrador" }));
app.get("/readyz", (_req, res) => res.status(DB_READY ? 200 : 503).json({ db: DB_READY }));

// ✅ Ruta de prueba
app.get("/", (_req, res) => {
  logger.info("📩 GET / - Servidor de Administradores activo");
  res.send("✅ Servidor de Administradores en funcionamiento");
});

// ✅ Middleware global de errores (al final)
app.use((err, req, res, _next) => {
  logger.error(`❌ Error en el servidor (admin): ${err?.message || err}`);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ✅ Iniciar servidor
const srv = app
  .listen(PORT, () => {
    logger.info(`🟢 Escuchando en http://localhost:${PORT}  (FRONTEND_URL=${FRONTEND_URL})`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`❌ Puerto ${PORT} en uso`);
    } else {
      logger.error(`❌ Error al iniciar servidor: ${err.message}`);
    }
  });

// 🔚 Señales de parada (para ver cierres ordenados)
process.on("SIGTERM", () => {
  logger.warn("↘️  SIGTERM recibido. Cerrando servidor admin…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});
process.on("SIGINT", () => {
  logger.warn("↘️  SIGINT (Ctrl+C). Cerrando servidor admin…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});

