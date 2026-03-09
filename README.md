# IoT Fleet Vehicle Tracking System

> A production-grade, real-time fleet management platform where GPS-enabled IoT devices stream live vehicle location data to a Node.js backend and are visualised on an interactive Angular dashboard.

---
# Screen Shots
<img width="1274" height="888" alt="fleet3" src="https://github.com/user-attachments/assets/c1898764-913c-4612-8b2e-64e10010da08" />

<img width="1277" height="897" alt="iot fllet" src="https://github.com/user-attachments/assets/d310936b-1995-4ddd-ac00-417f8ab07346" />

<img width="1278" height="687" alt="fleet2" src="https://github.com/user-attachments/assets/34e0a10e-d382-4159-af55-1f2d8b305eb1" />


## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  IoT Fleet Tracking System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   GPS Device / Simulator                                        │
│   (Node.js MQTT publisher)                                      │
│           │                                                     │
│           │  MQTT  fleet/vehicle/{id}/location                  │
│           ▼                                                     │
│   ┌───────────────┐                                             │
│   │  MQTT Broker  │  (Mosquitto / HiveMQ / EMQX)               │
│   └───────┬───────┘                                             │
│           │                                                     │
│           ▼                                                     │
│   ┌─────────────────────────────────────────┐                   │
│   │         Node.js + Express Backend        │                   │
│   │  ┌──────────────┐  ┌─────────────────┐  │                   │
│   │  │  MQTT Service│  │  Socket.IO Svc  │  │                   │
│   │  │  (subscriber)│  │  (broadcaster)  │  │                   │
│   │  └──────┬───────┘  └────────┬────────┘  │                   │
│   │         │  Persist          │  Push RT   │                   │
│   │         ▼                   │            │                   │
│   │  ┌──────────────┐           │            │                   │
│   │  │   MongoDB     │           │            │                   │
│   │  │  (Mongoose)   │           │            │                   │
│   │  └──────────────┘           │            │                   │
│   └─────────────────────────────┼────────────┘                   │
│                                 │  WebSocket                     │
│                                 ▼                                 │
│   ┌────────────────────────────────────────────┐                 │
│   │         Angular Dashboard (port 4200)       │                 │
│   │  ┌──────────┐ ┌────────┐ ┌──────────────┐  │                 │
│   │  │ Dashboard│ │Live Map│ │Fleet Vehicles│  │                 │
│   │  │  Stats   │ │Leaflet │ │   & Analytics│  │                 │
│   │  └──────────┘ └────────┘ └──────────────┘  │                 │
│   └────────────────────────────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature                    | Description                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Real-time GPS tracking** | Vehicle locations update every 3 seconds via MQTT → Socket.IO                            |
| **Interactive map**        | Leaflet.js dark-themed map with animated vehicle markers, route trails, and info popups  |
| **Fleet dashboard**        | KPI cards: Total vehicles, Active, Idle, Offline, Distance Today, Avg Speed              |
| **Vehicle management**     | Register, view, and delete vehicles with full CRUD API                                   |
| **Driver analytics**       | Per-vehicle stats: avg speed, max speed, distance, travel time, idle time, fuel estimate |
| **Route history**          | Past route polyline visualised on the map from the last 2 hours of GPS data              |
| **Geofence alerts**        | Backend detects zone enter/exit events; pushed live to the dashboard                     |
| **GPS Simulator**          | Node.js script simulates 5 vehicles driving real routes in San Francisco / Bay Area      |
| **Auto vehicle seeding**   | Backend auto-creates 5 default vehicles on first start                                   |
| **TTL index**              | Location records auto-expire after 90 days                                               |

---

## Tech Stack

| Layer            | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| **Frontend**     | Angular 17, Angular Material, Leaflet.js, RxJS, Socket.IO client |
| **Backend**      | Node.js, Express.js, Socket.IO                                   |
| **IoT Protocol** | MQTT (mqtt.js)                                                   |
| **Database**     | MongoDB + Mongoose                                               |
| **Simulator**    | Node.js GPS data generator                                       |

---

## Project Structure

```
iot-fleet-tracking-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── models/
│   │   │   ├── Vehicle.js           # Vehicle schema
│   │   │   └── Location.js          # GPS location records (TTL: 90 days)
│   │   ├── controllers/
│   │   │   ├── vehicleController.js # CRUD + fleet stats
│   │   │   └── trackingController.js# History, live, analytics
│   │   ├── routes/
│   │   │   ├── vehicleRoutes.js
│   │   │   └── trackingRoutes.js
│   │   ├── services/
│   │   │   ├── mqttService.js       # MQTT subscriber + geofence logic
│   │   │   └── socketService.js     # Socket.IO broadcaster
│   │   ├── simulator/
│   │   │   └── gpsSimulator.js      # GPS device simulator (5 vehicles)
│   │   └── server.js                # Express app entry point
│   └── package.json
│
├── frontend/
│   └── fleet-tracking-dashboard/
│       ├── src/
│       │   ├── app/
│       │   │   ├── core/
│       │   │   │   ├── models/
│       │   │   │   │   └── vehicle.model.ts
│       │   │   │   └── services/
│       │   │   │       ├── api.service.ts
│       │   │   │       └── socket.service.ts
│       │   │   ├── features/
│       │   │   │   ├── dashboard/   # KPI cards + alerts panel
│       │   │   │   ├── map-view/    # Leaflet live map
│       │   │   │   └── vehicles/    # Vehicle table + analytics
│       │   │   ├── shared/
│       │   │   │   └── components/
│       │   │   │       ├── stats-card/
│       │   │   │       └── vehicle-card/
│       │   │   ├── app.component.ts # Sidebar shell
│       │   │   ├── app.config.ts
│       │   │   └── app.routes.ts
│       │   ├── environments/
│       │   └── styles.scss
│       ├── angular.json
│       └── package.json
│
└── README.md
```

---

## Prerequisites

| Tool        | Version                   |
| ----------- | ------------------------- |
| Node.js     | ≥ 18.x                    |
| npm         | ≥ 9.x                     |
| MongoDB     | ≥ 6.x (local or Atlas)    |
| MQTT Broker | Mosquitto / HiveMQ / EMQX |
| Angular CLI | ≥ 17.x                    |

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Ali508208/iot-fleet-tracking-system.git
cd iot-fleet-tracking-system
```

### 2. Start a local MQTT broker

**Option A — Mosquitto (recommended)**

```bash
# macOS
brew install mosquitto && brew services start mosquitto

# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto

# Windows — download installer from https://mosquitto.org/download/
```

**Option B — Docker**

```bash
docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
```

**Option C — Public test broker (no install)**

```bash
# Edit backend/.env and set:
MQTT_BROKER_URL=mqtt://test.mosquitto.org
```

### 3. Start MongoDB

```bash
# Local instance
mongod --dbpath /data/db

# Or use MongoDB Atlas — replace MONGODB_URI in backend/.env
```

### 4. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env as needed
npm install
```

**backend/.env**

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/iot-fleet-tracking
MQTT_BROKER_URL=mqtt://localhost:1883
SOCKET_CORS_ORIGIN=http://localhost:4200
NODE_ENV=development
```

### 5. Start the backend server

```bash
# Development (with live reload)
npm run dev

# Production
npm start
```

The server will:

- Connect to MongoDB and seed 5 default vehicles
- Subscribe to all `fleet/vehicle/+/location` MQTT topics
- Expose REST API on `http://localhost:3000/api`
- Start Socket.IO on port 3000

### 6. Install & run the Angular frontend

```bash
cd ../frontend/fleet-tracking-dashboard
npm install
ng serve
```

Open **http://localhost:4200** in your browser.

### 7. Run the GPS simulator

In a new terminal:

```bash
cd backend
npm run simulator
```

You will see 5 vehicles — TRUCK-101, VAN-202, CAR-303, BUS-404, TRUCK-505 — publishing location data every 3 seconds. Watch them move live on the map.

---

## API Reference

### Vehicles

| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/vehicles`               | List all vehicles        |
| GET    | `/api/vehicles/stats/summary` | Fleet KPI stats          |
| GET    | `/api/vehicles/:id`           | Get vehicle by ID        |
| POST   | `/api/vehicles`               | Register new vehicle     |
| PUT    | `/api/vehicles/:id`           | Update vehicle           |
| DELETE | `/api/vehicles/:id`           | Delete vehicle + history |

### Tracking

| Method | Endpoint                                 | Description                                          |
| ------ | ---------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/tracking/live`                     | Live locations of active vehicles                    |
| GET    | `/api/tracking/history/:vehicleId`       | Location history (with `from`, `to`, `limit` params) |
| GET    | `/api/tracking/analytics/:vehicleId`     | Driver analytics for a time period                   |
| GET    | `/api/tracking/route/:vehicleId/:tripId` | Full trip route coordinates                          |

### Health

```
GET /health
```

---

## MQTT Message Format

**Topic:** `fleet/vehicle/{vehicleId}/location`

**Payload (JSON):**

```json
{
  "vehicleId": "TRUCK-101",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "speed": 63,
  "heading": 90,
  "altitude": 28,
  "accuracy": 4,
  "timestamp": "2026-03-10T10:20:00.000Z",
  "tripId": "TRIP-TRUCK-101-2026-03-10"
}
```

---

## Socket.IO Events

### Client → Server

| Event                   | Payload             | Description                         |
| ----------------------- | ------------------- | ----------------------------------- |
| `subscribe:vehicle`     | `vehicleId: string` | Subscribe to a specific vehicle     |
| `unsubscribe:vehicle`   | `vehicleId: string` | Unsubscribe                         |
| `request:live-vehicles` | —                   | Request snapshot of active vehicles |

### Server → Client

| Event              | Payload                 | Description                          |
| ------------------ | ----------------------- | ------------------------------------ |
| `location:update`  | `LiveLocationUpdate`    | New GPS point for any vehicle        |
| `vehicle:location` | `LiveLocationUpdate`    | Directed to vehicle-specific room    |
| `vehicle:status`   | `{ vehicleId, status }` | Vehicle online/offline status change |
| `fleet:alert`      | `FleetAlert`            | Geofence enter/exit alert            |
| `live-vehicles`    | `{ data: Vehicle[] }`   | Snapshot of active vehicles          |

---

## Simulated Vehicles

| Vehicle ID | Route                       | Type  | Base Speed |
| ---------- | --------------------------- | ----- | ---------- |
| TRUCK-101  | SF → Oakland Loop           | Truck | 65 km/h    |
| VAN-202    | Downtown SF Delivery        | Van   | 40 km/h    |
| CAR-303    | Silicon Valley Commute      | Car   | 80 km/h    |
| BUS-404    | City Transit Route          | Bus   | 30 km/h    |
| TRUCK-505  | Port of Oakland → Warehouse | Truck | 55 km/h    |

---

## Dashboard Screenshots

The dashboard includes three main views:

1. **Dashboard** — Fleet KPI cards, active vehicle list with live telemetry, geofence alerts feed
2. **Live Map** — Dark Leaflet map with animated vehicle markers (heading-aware), route trails, vehicle info popups, clickable sidebar list
3. **Fleet Vehicles** — Sortable table, per-vehicle analytics panel (avg speed, fuel estimate, idle time), driver info, vehicle registration form

---

## Future Improvements

- **AI Route Optimisation** — Use ML models to suggest optimal delivery routes based on traffic patterns and historical data
- **Driver Behaviour Detection** — Identify harsh braking, rapid acceleration, and speeding events from GPS data
- **Predictive Vehicle Maintenance** — Correlate mileage and engine metrics to predict service intervals
- **Trip Replay** — Animate historical routes on the map with a time scrubber
- **Multi-tenant Support** — Fleet separation by organisation with role-based access control
- **Mobile App** — React Native companion app for drivers showing turn-by-turn status
- **OBD-II Integration** — Ingest real engine diagnostics (RPM, fuel level, fault codes) via ELM327 adapters
- **Weather Overlay** — Display real-time weather conditions along fleet routes

---

## Connecting a Real IoT Device

The system is protocol-compatible with any MQTT-capable embedded device.

**Example for ESP32 (Arduino/PlatformIO):**

```cpp
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>

// Publish to: fleet/vehicle/TRUCK-101/location
// JSON payload matches the schema above
client.publish("fleet/vehicle/TRUCK-101/location", payload);
```

**Example for Raspberry Pi (Python):**

```python
import paho.mqtt.client as mqtt
import json, time, gps

client = mqtt.Client()
client.connect("your-broker-host", 1883)

# Read from gpsd and publish
payload = json.dumps({
    "vehicleId": "TRUCK-101",
    "latitude": session.fix.latitude,
    "longitude": session.fix.longitude,
    "speed": session.fix.speed * 3.6,  # m/s to km/h
    "heading": session.fix.track,
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
})
client.publish("fleet/vehicle/TRUCK-101/location", payload, qos=1)
```

---

## License

MIT © 2026 IoT Fleet Tracking System
