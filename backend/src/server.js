require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/database");
const vehicleRoutes = require("./routes/vehicleRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const { initSocketService } = require("./services/socketService");
const { initMqttService } = require("./services/mqttService");

const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logger (development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "IoT Fleet Tracking Backend",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/tracking", trackingRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Server] Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;

const bootstrap = async () => {
  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Seed default vehicles if none exist
  await seedVehicles();

  // 3. Start Socket.IO
  const socketService = initSocketService(httpServer);

  // 4. Start MQTT listener
  initMqttService(socketService);

  // 5. Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(
      `\n[Server] IoT Fleet Tracking Backend running on port ${PORT}`,
    );
    console.log(
      `[Server] Environment: ${process.env.NODE_ENV || "development"}`,
    );
    console.log(`[Server] API: http://localhost:${PORT}/api`);
    console.log(`[Server] Health: http://localhost:${PORT}/health\n`);
  });
};

const seedVehicles = async () => {
  const Vehicle = require("./models/Vehicle");
  const count = await Vehicle.countDocuments();
  if (count > 0) return;

  const defaultVehicles = [
    {
      vehicleId: "TRUCK-101",
      name: "Heavy Hauler Alpha",
      type: "truck",
      driver: {
        name: "James Morrison",
        licenseNumber: "CDL-CA-112233",
        phone: "+1-415-555-0101",
      },
      specs: {
        make: "Volvo",
        model: "FH16",
        year: 2022,
        fuelEfficiency: 8,
        maxSpeed: 100,
      },
    },
    {
      vehicleId: "VAN-202",
      name: "City Delivery Van",
      type: "van",
      driver: {
        name: "Maria Garcia",
        licenseNumber: "DL-CA-445566",
        phone: "+1-415-555-0202",
      },
      specs: {
        make: "Ford",
        model: "Transit",
        year: 2023,
        fuelEfficiency: 14,
        maxSpeed: 120,
      },
    },
    {
      vehicleId: "CAR-303",
      name: "Executive Fleet Car",
      type: "car",
      driver: {
        name: "David Chen",
        licenseNumber: "DL-CA-778899",
        phone: "+1-408-555-0303",
      },
      specs: {
        make: "Toyota",
        model: "Camry",
        year: 2024,
        fuelEfficiency: 18,
        maxSpeed: 180,
      },
    },
    {
      vehicleId: "BUS-404",
      name: "Employee Shuttle",
      type: "bus",
      driver: {
        name: "Sarah Johnson",
        licenseNumber: "CDL-CA-334455",
        phone: "+1-415-555-0404",
      },
      specs: {
        make: "Mercedes",
        model: "Sprinter",
        year: 2022,
        fuelEfficiency: 10,
        maxSpeed: 100,
      },
    },
    {
      vehicleId: "TRUCK-505",
      name: "Port Logistics Truck",
      type: "truck",
      driver: {
        name: "Robert Kim",
        licenseNumber: "CDL-CA-667788",
        phone: "+1-510-555-0505",
      },
      specs: {
        make: "Peterbilt",
        model: "579",
        year: 2023,
        fuelEfficiency: 7,
        maxSpeed: 110,
      },
    },
  ];

  await Vehicle.insertMany(defaultVehicles);
  console.log(`[Server] Seeded ${defaultVehicles.length} default vehicles`);
};

// ─── Graceful shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  httpServer.close(() => {
    console.log("[Server] HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err.message);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
  process.exit(1);
});

bootstrap();
