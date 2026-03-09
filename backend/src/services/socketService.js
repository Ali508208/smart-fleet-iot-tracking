const { Server } = require("socket.io");

let io = null;
const connectedClients = new Map();

const initSocketService = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:4200",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    const clientId = socket.id;
    connectedClients.set(clientId, {
      socket,
      subscribedVehicles: new Set(),
      connectedAt: new Date(),
    });
    console.log(
      `[Socket.IO] Client connected: ${clientId} | Total: ${connectedClients.size}`,
    );

    // Client can subscribe to specific vehicles
    socket.on("subscribe:vehicle", (vehicleId) => {
      const client = connectedClients.get(clientId);
      if (client) {
        client.subscribedVehicles.add(vehicleId.toUpperCase());
        socket.join(`vehicle:${vehicleId.toUpperCase()}`);
        console.log(
          `[Socket.IO] ${clientId} subscribed to vehicle: ${vehicleId}`,
        );
      }
    });

    socket.on("unsubscribe:vehicle", (vehicleId) => {
      const client = connectedClients.get(clientId);
      if (client) {
        client.subscribedVehicles.delete(vehicleId.toUpperCase());
        socket.leave(`vehicle:${vehicleId.toUpperCase()}`);
      }
    });

    // Client requests current state of all vehicles
    socket.on("request:live-vehicles", async () => {
      try {
        const Vehicle = require("../models/Vehicle");
        const vehicles = await Vehicle.find({
          status: { $in: ["online", "idle"] },
        }).select("vehicleId name type status lastLocation");
        socket.emit("live-vehicles", { data: vehicles, timestamp: new Date() });
      } catch (err) {
        socket.emit("error", { message: "Failed to fetch live vehicles" });
      }
    });

    socket.on("disconnect", (reason) => {
      connectedClients.delete(clientId);
      console.log(
        `[Socket.IO] Client disconnected: ${clientId} | Reason: ${reason} | Remaining: ${connectedClients.size}`,
      );
    });

    socket.on("error", (err) => {
      console.error(`[Socket.IO] Error for ${clientId}:`, err.message);
    });
  });

  console.log("[Socket.IO] Service initialized");
  return io;
};

const broadcastLocationUpdate = (locationData) => {
  if (!io) return;
  // Broadcast to all clients
  io.emit("location:update", locationData);
  // Also emit to vehicle-specific room
  io.to(`vehicle:${locationData.vehicleId}`).emit(
    "vehicle:location",
    locationData,
  );
};

const broadcastAlert = (alertData) => {
  if (!io) return;
  io.emit("fleet:alert", alertData);
  console.log(
    `[Socket.IO] Alert broadcast: ${alertData.type} for ${alertData.vehicleId}`,
  );
};

const broadcastVehicleStatus = (vehicleId, status) => {
  if (!io) return;
  io.emit("vehicle:status", { vehicleId, status, timestamp: new Date() });
};

const getConnectedClientsCount = () => connectedClients.size;

const getIo = () => io;

module.exports = {
  initSocketService,
  broadcastLocationUpdate,
  broadcastAlert,
  broadcastVehicleStatus,
  getConnectedClientsCount,
  getIo,
};
