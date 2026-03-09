const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["truck", "van", "car", "motorcycle", "bus"],
      default: "truck",
    },
    driver: {
      name: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    specs: {
      make: { type: String, trim: true },
      model: { type: String, trim: true },
      year: { type: Number },
      fuelEfficiency: { type: Number, default: 12 }, // km/L
      maxSpeed: { type: Number, default: 120 },
    },
    status: {
      type: String,
      enum: ["online", "offline", "idle", "maintenance"],
      default: "offline",
    },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      speed: { type: Number, default: 0 },
      heading: { type: Number, default: 0 },
      timestamp: { type: Date },
    },
    geofences: [
      {
        name: { type: String },
        center: {
          latitude: { type: Number },
          longitude: { type: Number },
        },
        radius: { type: Number }, // meters
        alertOnEnter: { type: Boolean, default: true },
        alertOnExit: { type: Boolean, default: true },
      },
    ],
    totalDistance: { type: Number, default: 0 }, // km
    todayDistance: { type: Number, default: 0 }, // km
    lastActive: { type: Date },
  },
  {
    timestamps: true,
  },
);

vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ status: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

module.exports = Vehicle;
