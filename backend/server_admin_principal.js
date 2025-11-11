// backend/server_admin_principal.js
const dotenv = require("dotenv-flow");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const winston = require("winston");

const app = express();
const PORT = process.env.PORT_ADMIN_PRINCIPAL || 3004;

// ✅ Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "server_admin_principal.log" }),
    new winston.transports.Console(),
  ],
});

logger.info("🚀 Iniciando subservidor del Administrador Principal...");

// ✅ Conectar a MongoDB + sanear sesiones (solo rol admin_principal)
connectDB()
  .then(async () => {
    try {
      const User = require("./models/User");
      await User.resetSessionsOnBoot("admin_principal");
      logger.info("🧹 Sesiones saneadas para 'admin_principal' al iniciar.");
    } catch (e) {
      logger.warn(`⚠️ Saneo de sesiones fallido: ${e?.message || e}`);
    }
  })
  .catch((e) => logger.error(`❌ Error conectando a BD: ${e?.message || e}`));

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ✅ Rutas principales
app.use("/api/admin_principal/auth", require("./routes/admin_principal/auth_admin_principal"));
app.use("/auth", require("./routes/admin_principal/auth_admin_principal")); // alias legacy
app.use("/api/users", require("./routes/admin_principal/users"));
app.use("/api/status", require("./routes/admin_principal/statusChange"));
app.use("/api/delete", require("./routes/admin_principal/usersDelete"));
app.use("/logout", require("./routes/logout")); // alias legacy
app.use("/api/grupos", require("./routes/admin_principal/grupos"));
app.use("/api/horarios", require("./routes/admin_principal/horarios"));
app.use("/api/leerhorarios", require("./routes/admin_principal/leerhorarios"));
app.use("/api/eliminarGrupo", require("./routes/admin_principal/eliminarGrupo"));
app.use("/api/cargaVideos", require("./routes/general/cargaVideos"));
app.use("/api/bimestre-actual", require("./routes/general/bimestreActual"));

// 🟢 Estado de conexión (coincide con axiosAdmin baseURL)
app.use("/api/admin_principal", require("./routes/marcarConectado"));
// (Opcional) alias retrocompatible:
app.use("/", require("./routes/marcarConectado"));

// 🔎 Alias conveniente para verify-token
app.get("/verify-token", (req, res) =>
  res.redirect(307, "/api/admin_principal/auth/verify-token")
);

// ✅ Ruta raíz
app.get("/", (req, res) => {
  logger.info("📩 GET / - Servidor del Administrador Principal OK");
  res.send("✅ Servidor del Administrador Principal en funcionamiento");
});

// ✅ Manejo global de errores
app.use((err, req, res, next) => {
  logger.error(`❌ Error en el servidor: ${err.message}`);
  res.status(500).json({ message: "Error interno del servidor" });
});

// ✅ Iniciar
app
  .listen(PORT, () => {
    logger.info(`✅ Admin Principal escuchando en ${process.env.FRONTEND_URL || "http://localhost"}:${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`❌ Puerto ${PORT} en uso.`);
    } else {
      logger.error(`❌ Error al iniciar servidor: ${err.message}`);
    }
  });
