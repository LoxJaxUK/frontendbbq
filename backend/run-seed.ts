import mongoose from "mongoose";
import { seedDatabase } from "./seed";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin@phobbq.0wptjws.mongodb.net/?appName=phobbq";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await seedDatabase();
    console.log("Database seeding completed!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();