const express = require("express");
const router = express.Router();
const {
  getLocationHistory,
  getLiveLocations,
  getVehicleAnalytics,
  getTripRoute,
} = require("../controllers/trackingController");

router.get("/live", getLiveLocations);
router.get("/history/:vehicleId", getLocationHistory);
router.get("/analytics/:vehicleId", getVehicleAnalytics);
router.get("/route/:vehicleId/:tripId", getTripRoute);

module.exports = router;
