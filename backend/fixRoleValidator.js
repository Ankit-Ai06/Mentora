/**
 * Run this ONCE to remove the MongoDB collection-level role validator.
 * Usage: node fixRoleValidator.js
 * You can delete this file after running it once.
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Remove ALL collection-level validators from the users collection
    await db.command({
      collMod: "users",
      validator: {},
      validationLevel: "off",
    });

    console.log("✅ Removed role enum validator from users collection");
    console.log("   You can now use any role value (Student, Professional, etc.)");
    console.log("   Delete this file — it only needs to run once.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fix();
