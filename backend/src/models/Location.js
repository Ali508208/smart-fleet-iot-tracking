const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    heading: {
      type: Number,
      default: 0,
      min: 0,
      max: 360,
    },
    altitude: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 5, // meters
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    // Derived analytics
    distanceFromPrevious: {
      type: Number,
      default: 0, // km
    },
    tripId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient history queries
locationSchema.index({ vehicleId: 1, timestamp: -1 });
locationSchema.index({ vehicleId: 1, tripId: 1, timestamp: 1 });

// TTL index: auto-delete records older than 90 days
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
