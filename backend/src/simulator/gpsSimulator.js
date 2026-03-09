/**
 * GPS Simulator — IoT Fleet Tracking System
 *
 * Simulates multiple GPS-enabled vehicles publishing location data
 * over MQTT every 3 seconds. Mimics real IoT edge devices (ESP32/RPi).
 *
 * Usage:
 *   node src/simulator/gpsSimulator.js
 *   MQTT_BROKER_URL=mqtt://localhost:1883 node src/simulator/gpsSimulator.js
 */

require("dotenv").config();
const mqtt = require("mqtt");

// ─── Configuration ────────────────────────────────────────────────────────────
const BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const PUBLISH_INTERVAL_MS = 3000; // 3 seconds per spec
const TOPIC_PREFIX = "fleet/vehicle";

// ─── Route definitions: real city waypoints ──────────────────────────────────
const ROUTES = {
  "TRUCK-101": {
    name: "San Francisco → Oakland Loop",
    waypoints: [
      { lat: 37.7749, lon: -122.4194 },
      { lat: 37.7849, lon: -122.4094 },
      { lat: 37.7949, lon: -122.3994 },
      { lat: 37.8049, lon: -122.3894 },
      { lat: 37.81, lon: -122.375 },
      { lat: 37.8044, lon: -122.2712 }, // Oakland
      { lat: 37.79, lon: -122.29 },
      { lat: 37.77, lon: -122.31 },
      { lat: 37.76, lon: -122.35 },
      { lat: 37.7749, lon: -122.4194 },
    ],
    baseSpeed: 65,
    type: "truck",
  },
  "VAN-202": {
    name: "Downtown SF Delivery",
    waypoints: [
      { lat: 37.7694, lon: -122.4862 },
      { lat: 37.773, lon: -122.473 },
      { lat: 37.778, lon: -122.46 },
      { lat: 37.782, lon: -122.45 },
      { lat: 37.786, lon: -122.435 },
      { lat: 37.78, lon: -122.42 },
      { lat: 37.774, lon: -122.4 },
      { lat: 37.7694, lon: -122.4862 },
    ],
    baseSpeed: 40,
    type: "van",
  },
  "CAR-303": {
    name: "Silicon Valley Commute",
    waypoints: [
      { lat: 37.3861, lon: -122.0839 }, // Palo Alto
      { lat: 37.4, lon: -122.06 },
      { lat: 37.42, lon: -122.04 },
      { lat: 37.4419, lon: -122.143 }, // Mountain View
      { lat: 37.45, lon: -122.16 },
      { lat: 37.43, lon: -121.9 }, // Santa Clara area
      { lat: 37.4, lon: -121.95 },
      { lat: 37.3861, lon: -122.0839 },
    ],
    baseSpeed: 80,
    type: "car",
  },
  "BUS-404": {
    name: "City Transit Route",
    waypoints: [
      { lat: 37.7877, lon: -122.4082 },
      { lat: 37.78, lon: -122.415 },
      { lat: 37.772, lon: -122.42 },
      { lat: 37.764, lon: -122.413 },
      { lat: 37.758, lon: -122.41 },
      { lat: 37.752, lon: -122.405 },
      { lat: 37.758, lon: -122.395 },
      { lat: 37.768, lon: -122.39 },
      { lat: 37.778, lon: -122.395 },
      { lat: 37.7877, lon: -122.4082 },
    ],
    baseSpeed: 30,
    type: "bus",
  },
  "TRUCK-505": {
    name: "Port of Oakland → Warehouse",
    waypoints: [
      { lat: 37.7955, lon: -122.2892 }, // Port of Oakland
      { lat: 37.8, lon: -122.27 },
      { lat: 37.805, lon: -122.25 },
      { lat: 37.81, lon: -122.22 },
      { lat: 37.805, lon: -122.2 },
      { lat: 37.795, lon: -122.18 },
      { lat: 37.78, lon: -122.19 },
      { lat: 37.77, lon: -122.22 },
      { lat: 37.78, lon: -122.26 },
      { lat: 37.7955, lon: -122.2892 },
    ],
    baseSpeed: 55,
    type: "truck",
  },
};

// ─── Simulator state ──────────────────────────────────────────────────────────
const vehicleState = {};

Object.entries(ROUTES).forEach(([vehicleId, route]) => {
  vehicleState[vehicleId] = {
    waypointIndex: 0,
    progress: 0, // 0–1 between current and next waypoint
    tripId: `TRIP-${vehicleId}-${new Date().toISOString().slice(0, 10)}`,
    isOnline: true,
    idleCountdown: 0,
  };
});

// ─── Math helpers ─────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

const calcHeading = (lat1, lon1, lat2, lon2) => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const heading = (Math.atan2(y, x) * 180) / Math.PI;
  return (heading + 360) % 360;
};

const addNoise = (value, magnitude = 0.0001) =>
  value + (Math.random() - 0.5) * magnitude;

// Simulate realistic speed variations
const randomisedSpeed = (base) => {
  const variation = (Math.random() - 0.5) * 20;
  return Math.max(0, Math.round(base + variation));
};

// ─── MQTT client setup ────────────────────────────────────────────────────────
console.log(`[Simulator] Connecting to MQTT broker: ${BROKER_URL}`);

const client = mqtt.connect(BROKER_URL, {
  clientId: `gps-simulator-${Date.now()}`,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
});

client.on("connect", () => {
  console.log("[Simulator] Connected to MQTT broker");
  console.log(`[Simulator] Simulating ${Object.keys(ROUTES).length} vehicles`);
  console.log("[Simulator] Publishing every 3 seconds...\n");

  // Start simulation loop for each vehicle
  Object.entries(ROUTES).forEach(([vehicleId, route]) => {
    setInterval(
      () => publishVehicleLocation(vehicleId, route),
      PUBLISH_INTERVAL_MS,
    );
  });
});

client.on("error", (err) => {
  console.error("[Simulator] MQTT error:", err.message);
});

client.on("reconnect", () => {
  console.log("[Simulator] Reconnecting to MQTT broker...");
});

client.on("offline", () => {
  console.warn("[Simulator] Offline - waiting for broker connection...");
});

// ─── Main simulation function ─────────────────────────────────────────────────
const publishVehicleLocation = (vehicleId, route) => {
  const state = vehicleState[vehicleId];
  const waypoints = route.waypoints;

  // Occasional idle simulation (10% chance)
  if (state.idleCountdown > 0) {
    state.idleCountdown--;
    publishPayload(vehicleId, {
      latitude: addNoise(waypoints[state.waypointIndex].lat),
      longitude: addNoise(waypoints[state.waypointIndex].lon),
      speed: 0,
      heading: 0,
      tripId: state.tripId,
    });
    return;
  }

  if (Math.random() < 0.05) {
    state.idleCountdown = Math.floor(Math.random() * 5) + 2;
  }

  // Advance progress along route
  state.progress += 0.08 + Math.random() * 0.04; // ~8–12% per tick

  if (state.progress >= 1) {
    state.progress = 0;
    state.waypointIndex = (state.waypointIndex + 1) % waypoints.length;

    // Start a new trip when we complete a loop
    if (state.waypointIndex === 0) {
      state.tripId = `TRIP-${vehicleId}-${new Date().toISOString().slice(0, 13).replace("T", "-")}`;
      console.log(`[Simulator] ${vehicleId} started new trip: ${state.tripId}`);
    }
  }

  const currentWp = waypoints[state.waypointIndex];
  const nextWp = waypoints[(state.waypointIndex + 1) % waypoints.length];

  const latitude = addNoise(
    lerp(currentWp.lat, nextWp.lat, state.progress),
    0.00005,
  );
  const longitude = addNoise(
    lerp(currentWp.lon, nextWp.lon, state.progress),
    0.00005,
  );
  const heading = Math.round(
    calcHeading(currentWp.lat, currentWp.lon, nextWp.lat, nextWp.lon),
  );
  const speed = randomisedSpeed(route.baseSpeed);

  publishPayload(vehicleId, {
    latitude,
    longitude,
    speed,
    heading,
    tripId: state.tripId,
  });
};

const publishPayload = (vehicleId, data) => {
  const topic = `${TOPIC_PREFIX}/${vehicleId}/location`;
  const payload = {
    vehicleId,
    latitude: Math.round(data.latitude * 1000000) / 1000000,
    longitude: Math.round(data.longitude * 1000000) / 1000000,
    speed: data.speed,
    heading: data.heading,
    altitude: Math.round(Math.random() * 50 + 10),
    accuracy: Math.round(Math.random() * 5 + 2),
    timestamp: new Date().toISOString(),
    tripId: data.tripId,
  };

  client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
    if (err) {
      console.error(`[Simulator] Publish error for ${vehicleId}:`, err.message);
    } else {
      console.log(
        `[Simulator] ${vehicleId.padEnd(12)} | ` +
          `Lat: ${payload.latitude.toFixed(4)}, Lon: ${payload.longitude.toFixed(4)} | ` +
          `Speed: ${String(payload.speed).padStart(3)} km/h | Heading: ${String(payload.heading).padStart(3)}°`,
      );
    }
  });
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = () => {
  console.log("\n[Simulator] Shutting down...");
  client.end(true, () => {
    console.log("[Simulator] MQTT connection closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
