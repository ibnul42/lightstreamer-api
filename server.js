const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./src/db");
const routes = require("./src/routes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect Database
connectDB();

// API Routes
app.use("/api", routes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
