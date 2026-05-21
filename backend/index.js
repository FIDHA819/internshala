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
      "http://localhost:3000",
      "https://internshala-topaz.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middlewares
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

// DB
connect();

// Server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});