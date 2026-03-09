export interface Vehicle {
  _id?: string;
  vehicleId: string;
  name: string;
  type: "truck" | "van" | "car" | "motorcycle" | "bus";
  driver?: {
    name: string;
    licenseNumber?: string;
    phone?: string;
  };
  specs?: {
    make?: string;
    model?: string;
    year?: number;
    fuelEfficiency?: number;
    maxSpeed?: number;
  };
  status: "online" | "offline" | "idle" | "maintenance";
  lastLocation?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
  geofences?: Geofence[];
  totalDistance: number;
  todayDistance: number;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationRecord {
  _id?: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
  distanceFromPrevious?: number;
  tripId?: string;
}

export interface Geofence {
  name: string;
  center: { latitude: number; longitude: number };
  radius: number;
  alertOnEnter: boolean;
  alertOnExit: boolean;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  maintenanceVehicles: number;
  totalDistanceToday: number;
  averageSpeed: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  travelTime: number;
  idleTime: number;
  tripCount: number;
  fuelEstimate: number;
  dataPoints: number;
}

export interface LiveLocationUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: string;
  distanceFromPrevious: number;
}

export interface FleetAlert {
  type: "GEOFENCE_ENTER" | "GEOFENCE_EXIT" | "SPEED_ALERT" | "OFFLINE_ALERT";
  vehicleId: string;
  fenceName?: string;
  message?: string;
  timestamp: string;
}
