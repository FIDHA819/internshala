const mongoose = require("mongoose");

async function connect() {
  await mongoose.connect(
    process.env.MONGO_URL
  );

  console.log("database is connected");
}

module.exports = { connect };