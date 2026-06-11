require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const { connect } = require("./db");
const router = require("./Routes/index");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
app.use(
  "/uploads",
  express.static("uploads")
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/api", router);

async function start() {
  try {
    console.log("Starting server...");

    console.log("DATABASE_URL exists:",
      !!process.env.DATABASE_URL
    );

    await connect();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);

    process.exit(1);
  }
}

start();