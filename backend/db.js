const mongoose = require("mongoose");

async function connect() {
  console.log("Connecting Mongo...");

  await mongoose.connect(
    process.env.DATABASE_URL
  );

  console.log("database connected");
}

module.exports = { connect };
