const Vehicle = require("../models/Vehicle");
const Location = require("../models/Location");

// GET /api/vehicles
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).sort({ vehicleId: 1 });
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      vehicleId: req.params.id.toUpperCase(),
    });
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { vehicleId, name, type, driver, specs } = req.body;

    const existing = await Vehicle.findOne({
      vehicleId: vehicleId?.toUpperCase(),
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Vehicle ID already exists" });
    }

    const vehicle = new Vehicle({ vehicleId, name, type, driver, specs });
    await vehicle.save();

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId: req.params.id.toUpperCase() },
      req.body,
      { new: true, runValidators: true },
    );
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      vehicleId: req.params.id.toUpperCase(),
    });
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }
    // Also remove location history
    await Location.deleteMany({ vehicleId: req.params.id.toUpperCase() });
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vehicles/stats/summary
const getFleetStats = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const active = await Vehicle.countDocuments({ status: "online" });
    const idle = await Vehicle.countDocuments({ status: "idle" });
    const offline = await Vehicle.countDocuments({ status: "offline" });
    const maintenance = await Vehicle.countDocuments({ status: "maintenance" });

    const distanceResult = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          totalDistance: { $sum: "$todayDistance" },
          avgSpeed: { $avg: "$lastLocation.speed" },
        },
      },
    ]);

    const stats = distanceResult[0] || { totalDistance: 0, avgSpeed: 0 };

    res.json({
      success: true,
      data: {
        totalVehicles: total,
        activeVehicles: active,
        idleVehicles: idle,
        offlineVehicles: offline,
        maintenanceVehicles: maintenance,
        totalDistanceToday: Math.round(stats.totalDistance * 100) / 100,
        averageSpeed: Math.round((stats.avgSpeed || 0) * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getFleetStats,
};
