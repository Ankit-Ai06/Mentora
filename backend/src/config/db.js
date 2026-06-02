const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    console.log(
      "MONGO_URI starts with:",
      process.env.MONGO_URI
        ? process.env.MONGO_URI.substring(0, 20)
        : "undefined"
    );

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("MongoDB Connection Error");
    console.log(error.message);
  }
};

module.exports = connectDB;