const Location = require("../models/Location");
const Vehicle = require("../models/Vehicle");

// GET /api/tracking/history/:vehicleId
const getLocationHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { from, to, limit = 500 } = req.query;

    const query = { vehicleId: vehicleId.toUpperCase() };

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tracking/live
const getLiveLocations = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: { $in: ["online", "idle"] } })
      .select("vehicleId name type status lastLocation driver")
      .sort({ vehicleId: 1 });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles.map((v) => ({
        vehicleId: v.vehicleId,
        name: v.name,
        type: v.type,
        status: v.status,
        driver: v.driver,
        location: v.lastLocation,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tracking/analytics/:vehicleId
const getVehicleAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { from, to } = req.query;

    const startDate = from
      ? new Date(from)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const locations = await Location.find({
      vehicleId: vehicleId.toUpperCase(),
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });

    if (locations.length === 0) {
      return res.json({
        success: true,
        data: {
          vehicleId,
          totalDistance: 0,
          averageSpeed: 0,
          maxSpeed: 0,
          travelTime: 0,
          idleTime: 0,
          tripCount: 0,
          fuelEstimate: 0,
        },
      });
    }

    let totalDistance = 0;
    let totalSpeed = 0;
    let maxSpeed = 0;
    let idleTime = 0;
    const speedReadings = locations.length;
    let tripCount = 0;
    let lastTripId = null;

    for (const loc of locations) {
      totalDistance += loc.distanceFromPrevious || 0;
      totalSpeed += loc.speed || 0;
      if (loc.speed > maxSpeed) maxSpeed = loc.speed;
      if (loc.speed < 5) idleTime += 3; // 3 seconds per reading
      if (loc.tripId && loc.tripId !== lastTripId) {
        tripCount++;
        lastTripId = loc.tripId;
      }
    }

    const travelTimeSeconds = (endDate - startDate) / 1000;
    const avgSpeed = speedReadings > 0 ? totalSpeed / speedReadings : 0;

    // Get vehicle fuel efficiency
    const vehicle = await Vehicle.findOne({
      vehicleId: vehicleId.toUpperCase(),
    });
    const fuelEfficiency = vehicle?.specs?.fuelEfficiency || 12;
    const fuelEstimate = totalDistance / fuelEfficiency;

    res.json({
      success: true,
      data: {
        vehicleId,
        totalDistance: Math.round(totalDistance * 100) / 100,
        averageSpeed: Math.round(avgSpeed * 100) / 100,
        maxSpeed: Math.round(maxSpeed * 100) / 100,
        travelTime: Math.round(travelTimeSeconds / 60), // minutes
        idleTime: Math.round(idleTime / 60), // minutes
        tripCount,
        fuelEstimate: Math.round(fuelEstimate * 100) / 100, // liters
        dataPoints: locations.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tracking/route/:vehicleId/:tripId
const getTripRoute = async (req, res) => {
  try {
    const { vehicleId, tripId } = req.params;

    const locations = await Location.find({
      vehicleId: vehicleId.toUpperCase(),
      tripId,
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLocationHistory,
  getLiveLocations,
  getVehicleAnalytics,
  getTripRoute,
};
