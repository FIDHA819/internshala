const mongoose = require("mongoose");

async function connect() {
  try {
    console.log("Connecting Mongo...");

    await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("database connected");
  } catch (err) {
    console.log("MONGO ERROR:");
    console.log(err.message);
    throw err;
  }
}

module.exports = { connect };