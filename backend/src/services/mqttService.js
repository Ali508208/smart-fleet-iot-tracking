const mqtt = require("mqtt");
const Location = require("../models/Location");
const Vehicle = require("../models/Vehicle");

let mqttClient = null;
let socketService = null;

// Haversine formula to calculate distance between two GPS points (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Check if a point is within a circular geofence
const isInsideGeofence = (lat, lon, center, radius) => {
  const dist = calculateDistance(lat, lon, center.latitude, center.longitude);
  return dist * 1000 <= radius; // radius in meters
};

const processLocationUpdate = async (vehicleId, payload) => {
  try {
    const {
      latitude,
      longitude,
      speed,
      heading,
      timestamp,
      altitude,
      accuracy,
      tripId,
    } = payload;

    // Validate coordinates
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      console.warn(
        `[MQTT] Invalid coordinates for ${vehicleId}: ${latitude}, ${longitude}`,
      );
      return;
    }

    // Find previous location to calculate distance
    const prevLocation = await Location.findOne({ vehicleId }).sort({
      timestamp: -1,
    });

    let distanceFromPrevious = 0;
    if (prevLocation) {
      distanceFromPrevious = calculateDistance(
        prevLocation.latitude,
        prevLocation.longitude,
        latitude,
        longitude,
      );
    }

    // Save new location record
    const locationRecord = new Location({
      vehicleId,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      altitude: altitude || 0,
      accuracy: accuracy || 5,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      distanceFromPrevious,
      tripId:
        tripId || `TRIP-${vehicleId}-${new Date().toISOString().slice(0, 10)}`,
    });

    await locationRecord.save();

    // Update vehicle document
    const vehicleUpdate = {
      status: speed > 5 ? "online" : "idle",
      lastLocation: {
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: locationRecord.timestamp,
      },
      lastActive: new Date(),
      $inc: {
        totalDistance: distanceFromPrevious,
        todayDistance: distanceFromPrevious,
      },
    };

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      vehicleUpdate,
      { new: true, upsert: false },
    );

    if (!vehicle) {
      console.warn(
        `[MQTT] Vehicle ${vehicleId} not found in DB — creating auto-entry`,
      );
      await Vehicle.create({
        vehicleId,
        name: vehicleId,
        type: "truck",
        status: speed > 5 ? "online" : "idle",
        lastLocation: {
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          timestamp: locationRecord.timestamp,
        },
        lastActive: new Date(),
        totalDistance: distanceFromPrevious,
        todayDistance: distanceFromPrevious,
      });
    }

    // Check geofences
    if (vehicle && vehicle.geofences && vehicle.geofences.length > 0) {
      for (const fence of vehicle.geofences) {
        const inside = isInsideGeofence(
          latitude,
          longitude,
          fence.center,
          fence.radius,
        );
        const prevInside = prevLocation
          ? isInsideGeofence(
              prevLocation.latitude,
              prevLocation.longitude,
              fence.center,
              fence.radius,
            )
          : null;

        if (prevInside !== null) {
          if (inside && !prevInside && fence.alertOnEnter) {
            const alert = {
              type: "GEOFENCE_ENTER",
              vehicleId,
              fenceName: fence.name,
              timestamp: new Date(),
            };
            console.log(`[Geofence] ${vehicleId} ENTERED zone: ${fence.name}`);
            if (socketService) socketService.broadcastAlert(alert);
          } else if (!inside && prevInside && fence.alertOnExit) {
            const alert = {
              type: "GEOFENCE_EXIT",
              vehicleId,
              fenceName: fence.name,
              timestamp: new Date(),
            };
            console.log(`[Geofence] ${vehicleId} EXITED zone: ${fence.name}`);
            if (socketService) socketService.broadcastAlert(alert);
          }
        }
      }
    }

    // Emit real-time update via Socket.IO
    if (socketService) {
      socketService.broadcastLocationUpdate({
        vehicleId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: locationRecord.timestamp,
        status: vehicleUpdate.status,
        distanceFromPrevious,
      });
    }
  } catch (error) {
    console.error(
      `[MQTT] Error processing location for ${vehicleId}:`,
      error.message,
    );
  }
};

const initMqttService = (socketSvc) => {
  socketService = socketSvc;

  const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
  const options = {
    clientId: `fleet-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  };

  if (process.env.MQTT_USERNAME) options.username = process.env.MQTT_USERNAME;
  if (process.env.MQTT_PASSWORD) options.password = process.env.MQTT_PASSWORD;

  console.log(`[MQTT] Connecting to broker: ${brokerUrl}`);
  mqttClient = mqtt.connect(brokerUrl, options);

  mqttClient.on("connect", () => {
    console.log("[MQTT] Connected to broker successfully");
    // Subscribe to all vehicle location topics
    mqttClient.subscribe("fleet/vehicle/+/location", { qos: 1 }, (err) => {
      if (err) {
        console.error("[MQTT] Subscription error:", err.message);
      } else {
        console.log("[MQTT] Subscribed to: fleet/vehicle/+/location");
      }
    });
  });

  mqttClient.on("message", async (topic, message) => {
    try {
      // Extract vehicleId from topic: fleet/vehicle/{vehicleId}/location
      const parts = topic.split("/");
      if (parts.length !== 4 || parts[0] !== "fleet" || parts[3] !== "location")
        return;
      const vehicleId = parts[2].toUpperCase();

      const payload = JSON.parse(message.toString());
      await processLocationUpdate(vehicleId, payload);
    } catch (err) {
      console.error("[MQTT] Message parse error:", err.message);
    }
  });

  mqttClient.on("error", (err) => {
    console.error("[MQTT] Connection error:", err.message);
  });

  mqttClient.on("reconnect", () => {
    console.log("[MQTT] Reconnecting to broker...");
  });

  mqttClient.on("offline", () => {
    console.warn("[MQTT] Client is offline");
  });

  mqttClient.on("close", () => {
    console.warn("[MQTT] Connection closed");
  });

  return mqttClient;
};

const getMqttClient = () => mqttClient;

module.exports = { initMqttService, getMqttClient, calculateDistance };
