// backend/server_maestro.js
// 🚀 SUBSERVIDOR: Maestro (clonado del server_administrador, con APIs del rol maestro)

const dotenv = require("dotenv-flow");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const winston = require("winston");
const path = require("path");
const connectDB = require("./config/db");
const { UPLOADS_ROOT } = require("./config/uploadsPath");

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
    new winston.transports.File({ filename: "server_maestro.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

logger.info("🚀 Iniciando subservidor de Maestros...");

const app = express();
const PORT = Number(process.env.PORT_MAESTRO || 3002);
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

let DB_READY = false;

// ✅ Conexión a MongoDB + saneo de sesiones al iniciar (solo rol "maestro")
(async () => {
  try {
    await connectDB();
    DB_READY = true;
    logger.info("🗄️  Conectado a MongoDB (maestro)");
    try {
      const shouldReset =
        (process.env.RESET_SESSIONS_ON_BOOT || "true").toLowerCase() === "true";
      if (shouldReset) {
        const User = require("./models/User"); // modelo base c/ discriminador
        await User.resetSessionsOnBoot("maestro");
        logger.info("🧹 Sesiones saneadas para rol 'maestro' al iniciar.");
      } else {
        logger.info("↪️ RESET_SESSIONS_ON_BOOT=false → no se sanean sesiones en arranque (maestro).");
      }
    } catch (e) {
      logger.warn(`⚠️ No se pudo sanear sesiones al inicio (maestro): ${e?.message || e}`);
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

// ✅ Archivos estáticos (ruta centralizada, igual que en alumno)
app.use("/uploads", express.static(UPLOADS_ROOT));
logger.info(`📂 Serviendo /uploads desde: ${UPLOADS_ROOT}`);

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
// 📌 Rutas API del MAESTRO (manteniendo los paths propios del rol)
// -------------------------------------------------------------------

// 🔐 Auth del maestro (verify-token, login, logout, etc.)
safeMount("/api/maestro/auth", "./routes/maestro/auth_maestro");

// 🧑‍🏫 Crear Aulas (endpoints de creación y configuración inicial)
safeMount("/api/maestro/crear-aulas", "./routes/maestro/crear_aulas");

// 🧑‍🏫 Estado actual de aulas (en curso / por comenzar)
safeMount("/api/maestro/aulas", "./routes/maestro/aulas_estado");

// 🟢 Estado de conexión (expuesto como /api/maestro/marcar-conectado)
safeMount("/api/maestro", "./routes/marcarConectado");

// ✅ Alias retrocompatible para llamadas viejas a "/marcar-conectado"
safeMount("/", "./routes/marcarConectado");

// 📷 Perfil / uploads compartidos (mantener exactamente estos mounts del maestro)
safeMount("/api/perfil/upload", "./routes/general/fotosPerfil");
safeMount("/perfil/upload", "./routes/general/fotosPerfil");

// 📚 Lectura de grupos/horarios generados por admin_principal (si aplican al maestro)
safeMount("/api/grupos", "./routes/general/leerGruposHorarios");

// 📝 Registro (en caso de usar registro común)
safeMount("/api/register", "./routes/register");

// 🔎 Alias conveniente: /verify-token → /api/maestro/auth/verify-token (307 mantiene método/headers/cookies)
app.get("/verify-token", (req, res) => {
  logger.info("↪️  /verify-token → 307 /api/maestro/auth/verify-token");
  res.redirect(307, "/api/maestro/auth/verify-token");
});

// ✅ Health / readiness
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, role: "maestro" }));
app.get("/readyz", (_req, res) => res.status(DB_READY ? 200 : 503).json({ db: DB_READY }));

// ✅ Ruta de prueba
app.get("/", (_req, res) => {
  logger.info("📩 GET / - Servidor de Maestros activo");
  res.send("✅ Servidor de Maestros en funcionamiento");
});

// ✅ Middleware global de errores (al final)
app.use((err, req, res, _next) => {
  logger.error(`❌ Error en el servidor (maestro): ${err?.message || err}`);
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
  logger.warn("↘️  SIGTERM recibido. Cerrando servidor maestro…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});
process.on("SIGINT", () => {
  logger.warn("↘️  SIGINT (Ctrl+C). Cerrando servidor maestro…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});

