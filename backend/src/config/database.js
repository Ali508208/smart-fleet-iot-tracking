const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/iot-fleet-tracking";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] Connected to MongoDB: ${mongoUri}`);

    mongoose.connection.on("disconnected", () => {
      console.warn("[Database] MongoDB disconnected. Attempting reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("[Database] MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[Database] MongoDB error:", err.message);
    });
  } catch (error) {
    console.error("[Database] Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
