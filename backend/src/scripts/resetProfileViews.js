const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");

dotenv.config();

const resetProfileViews = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.updateMany(
    {},
    {
      $set: {
        profileViews: 0,
        profileViewers: [],
      },
    }
  );

  console.log(`Profile views reset for ${result.modifiedCount} users.`);
  await mongoose.disconnect();
};

resetProfileViews().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
