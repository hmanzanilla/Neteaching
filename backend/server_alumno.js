// backend/server_alumno.js
// 🚀 SUBSERVIDOR: Alumno (cookies httpOnly, CORS robusto, logging y health)

const dotenv = require("dotenv-flow");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const winston = require("winston");
const path = require("path");

const connectDB = require("./config/db");
const authenticateAlumno = require("./middlewares/alumno/auth_alumno");
const { UPLOADS_ROOT } = require("./config/uploadsPath");

// —— Captura de errores globales para detectar crasheos ocultos
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
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "server_alumno.log" }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

logger.info("🚀 Iniciando subservidor de alumnos...");

const app = express();
const PORT = Number(process.env.PORT_ALUMNO || 3001);
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;

let DB_READY = false;

// ✅ Conexión a MongoDB + saneo de sesiones al iniciar (solo rol "alumno")
(async () => {
  try {
    await connectDB();
    DB_READY = true;
    logger.info("🗄️  Conectado a MongoDB (alumno)");
    try {
      const shouldReset = (process.env.RESET_SESSIONS_ON_BOOT || "true").toLowerCase() === "true";
      if (shouldReset) {
        const User = require("./models/User"); // modelo base (discriminador por rol)
        await User.resetSessionsOnBoot("alumno");
        logger.info("🧹 Sesiones saneadas para rol 'alumno' al iniciar.");
      } else {
        logger.info("↪️ RESET_SESSIONS_ON_BOOT=false → no se sanean sesiones en arranque (alumno).");
      }
    } catch (e) {
      logger.warn(`⚠️ No se pudo sanear sesiones al inicio (alumno): ${e?.message || e}`);
    }
  } catch (e) {
    logger.error(`❌ Error conectando a BD: ${e?.message || e}`);
  }
})();

// ===========================
// ✅ CORS robusto con fallback
// ===========================
const strictCors = String(process.env.STRICT_CORS ?? "true").toLowerCase() === "true";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

logger.info(`[CORS alumno] STRICT_CORS=${strictCors} | ALLOWED_ORIGINS=${JSON.stringify(allowedOrigins)}`);

const corsConfig = strictCors
  ? {
      origin: (origin, callback) => {
        // Permitir llamadas sin Origin (curl / server-side) y el listado permitido
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`❌ [CORS alumno] Bloqueado: ${origin}`);
          callback(new Error("No permitido por CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"],
    }
  : {
      // 🔓 Modo laxo temporal (para diagnóstico)
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"],
    };

app.use(cors(corsConfig));

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

// ✅ Archivos estáticos (ruta centralizada)
app.use("/uploads", express.static(UPLOADS_ROOT));
logger.info(`📂 Serviendo /uploads desde: ${UPLOADS_ROOT}`);

// ——— helper: montar rutas con try/catch y logs
function safeMount(mountPath, routerPath, label = routerPath) {
  try {
    app.use(mountPath, require(routerPath));
    logger.info(`✅ Montado ${mountPath} -> ${label}`);
  } catch (e) {
    logger.error(`❌ No se pudo montar ${mountPath} desde ${label}: ${e?.message || e}`);
  }
}

// -------------------------------------------------------------------
// 📌 Rutas API del ALUMNO (se respetan exactamente tus paths actuales)
// -------------------------------------------------------------------

// Auth (sin prefijo y con prefijo) → /auth/* y /api/alumno/auth/*
safeMount("/auth", "./routes/alumno/auth_alumno", "routes/alumno/auth_alumno");
safeMount("/api/alumno/auth", "./routes/alumno/auth_alumno", "routes/alumno/auth_alumno");

// Rutas varias
safeMount("/api/register", "./routes/register", "routes/register");
safeMount("/logout", "./routes/logout", "routes/logout");
safeMount("/api/pruebas", "./routes/alumno/auth_alumno_pruebas", "routes/alumno/auth_alumno_pruebas");
safeMount("/api/suscripcion", "./routes/alumno/auth_suscripcion", "routes/alumno/auth_suscripcion");
safeMount("/api/suscripcion/verificar", "./routes/alumno/verificar_suscripcion", "routes/alumno/verificar_suscripcion");

// Simuladores: autenticado pero permitiendo inactivo
try {
  const routerSimuladores = require("./routes/simuladores/index");
  app.use("/api/simuladores", authenticateAlumno(false), routerSimuladores);
  logger.info("✅ Montado /api/simuladores con authenticateAlumno(false)");
} catch (e) {
  logger.error(`❌ No se pudo montar /api/simuladores: ${e?.message || e}`);
}

// Perfil / fotos (usa rutas centralizadas y modelo FotoPerfil)
safeMount("/api/perfil/upload", "./routes/general/fotosPerfil", "routes/general/fotosPerfil");
safeMount("/perfil/upload", "./routes/general/fotosPerfil", "routes/general/fotosPerfil");

// Contenido general
safeMount("/api/videosAlumno", "./routes/general/leerVideos", "routes/general/leerVideos");
safeMount("/api/leerBimestre", "./routes/general/leerBimestre", "routes/general/leerBimestre");
safeMount("/api/leerGruposHorarios", "./routes/general/leerGruposHorarios", "routes/general/leerGruposHorarios");

// Selección de grupo
safeMount("/api/seleccionarGrupo", "./routes/alumno/seleccionarGrupo", "routes/alumno/seleccionarGrupo");

// Marcar Conectado (ambas rutas que ya usas)
safeMount("/", "./routes/marcarConectado", "routes/marcarConectado");
safeMount("/api/alumno", "./routes/marcarConectado", "routes/marcarConectado");

// 🔎 Alias conveniente: /verify-token → /api/alumno/auth/verify-token
// (307 mantiene método/headers/cookies)
app.get("/verify-token", (req, res) => {
  logger.info("↪️  /verify-token → 307 /api/alumno/auth/verify-token");
  res.redirect(307, "/api/alumno/auth/verify-token");
});

// ✅ Health / readiness
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, role: "alumno" }));
app.get("/readyz", (_req, res) => res.status(DB_READY ? 200 : 503).json({ db: DB_READY }));

// ✅ Ruta de prueba/healthcheck simple
app.get("/", (_req, res) => {
  logger.info("📩 GET / - Servidor de alumnos activo");
  res.send("✅ Servidor de alumnos en funcionamiento");
});

// ✅ Manejo de errores global
app.use((err, req, res, _next) => {
  logger.error(`❌ Error global (alumno): ${err?.message || err}`);
  if (!res.headersSent) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// ✅ Iniciar servidor
const srv = app
  .listen(PORT, () => {
    logger.info(`🟢 Escuchando en http://localhost:${PORT}  (FRONTEND_URL=${FRONTEND_URL})`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`❌ Puerto ${PORT} en uso.`);
    } else {
      logger.error(`❌ Error al iniciar servidor: ${err.message}`);
    }
  });

// 🔚 Señales de parada (cierres ordenados)
process.on("SIGTERM", () => {
  logger.warn("↘️  SIGTERM recibido. Cerrando servidor alumno…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});
process.on("SIGINT", () => {
  logger.warn("↘️  SIGINT (Ctrl+C). Cerrando servidor alumno…");
  try { srv.close(() => process.exit(0)); } catch { process.exit(0); }
});
