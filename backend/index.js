const bodyparser = require("body-parser");
const express = require("express");
const cors = require("cors");

const app = express();

const { connect } = require("./db");
const router = require("./Routes/index");

const port = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: [
      "https://internshala-topaz.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

app.use(
  bodyparser.json({
    limit: "50mb",
  })
);

app.use(
  bodyparser.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("hello this is internshala backend");
});

app.use("/api", router);

// Start server AFTER DB connects
async function start() {
  try {
    await connect();

    app.listen(port, () => {
      console.log(`Server running on ${port}`);
    });

  } catch (err) {
    console.log("Startup error:", err);
    process.exit(1);
  }
}

start();