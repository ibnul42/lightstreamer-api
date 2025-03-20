const express = require("express");
const router = express.Router();
const {
  getApiList,
  createId,
  sendCommand,
  processCommand,
  getPendingCommands,
} = require("./controllers/apiController");

// Define routes
router.get("/", getApiList);
router.post("/create-id", createId);
router.post("/send-command", sendCommand);
router.post("/process-command", processCommand);
router.get("/pending-commands", getPendingCommands);

module.exports = router;
