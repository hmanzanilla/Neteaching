// server.js con WebSockets (Socket.IO) + WebRTC Signaling Server
/*const { fork } = require("child_process");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const User = require("./models/User");

console.log("🚀 Iniciando servidor principal...");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3005",
  "http://localhost:3004"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

// Subservidores
const subServers = [
  { path: "server_alumno.js", port: 3001, name: "Alumno" },
  { path: "server_maestro.js", port: 3002, name: "Maestro" },
  { path: "server_administrador.js", port: 3003, name: "Administrador" },
  { path: "server_admin_principal.js", port: 3004, name: "Admin Principal" },
];

subServers.forEach(({ path, port, name }) => {
  console.log(`⚡ Iniciando subservidor ${name} en puerto ${port}`);
  fork(path, [port]);
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// WebSocket + WebRTC Signaling
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado a WebSockets");

  socket.on("joinRoom", ({ room, user }) => {
    if (!room || !user) return;
    socket.join(room);
    console.log(`👤 ${user} se unió a la sala ${room}`);
    io.to(room).emit("userJoined", { user });
  });

  // 🔁 Mensajería básica
  socket.on("message", ({ room, user, text }) => {
    if (!room || !user || !text) return;
    io.to(room).emit("message", { user, text });
  });

  // 🖌️ Dibujo colaborativo (Pizarrón)
  socket.on("draw", ({ room, data }) => {
    if (!room || !data) return;
    io.to(room).emit("draw", data);
  });

  // 📹 WebRTC Signaling Events
  socket.on("webrtc-offer", ({ room, offer }) => {
    socket.to(room).emit("webrtc-offer", offer);
  });

  socket.on("webrtc-answer", ({ room, answer }) => {
    socket.to(room).emit("webrtc-answer", answer);
  });

  socket.on("webrtc-candidate", ({ room, candidate }) => {
    socket.to(room).emit("webrtc-candidate", candidate);
  });

  // 🔄 Cambio de estado desde admin
  socket.on("estado_actualizado", async ({ userId, statusDesdeSocket }) => {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const statusEnMongo = user.status;
      if (statusEnMongo !== statusDesdeSocket) {
        console.log(`⚠️ Incongruencia estado → DB: '${statusEnMongo}', Socket: '${statusDesdeSocket}'`);
      } else {
        console.log(`✅ Estado coherente: ${statusEnMongo}`);
      }
    } catch (err) {
      console.error("❌ Error al verificar estado del usuario:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado de WebSockets");
  });
});

// Middleware global de errores
app.use((err, req, res, next) => {
  console.error(`❌ Error en el servidor: ${err.message}`);
  res.status(500).json({ message: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor principal en http://localhost:${PORT}`);
});
*/