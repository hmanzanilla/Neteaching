const socket = io("http://localhost:3000", {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("🟢 Conectado al WebSocket");

  // Enviamos prueba
  socket.emit("ping", "Hola desde el cliente!");
});

socket.on("pong", (mensaje) => {
  console.log("📩 Respuesta del servidor:", mensaje);
});