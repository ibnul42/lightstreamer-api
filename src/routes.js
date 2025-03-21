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
router.get("/discovery", getApiList);
router.post("/enroll", createId);
router.post("/send-command", sendCommand);
router.post("/update-command", processCommand);
router.get("/pending-commands", getPendingCommands);

module.exports = router;
