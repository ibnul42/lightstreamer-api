const { LightstreamerClient } = require("lightstreamer-client-node");
const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");

// API 1 - Get API List
exports.getApiList = async (req, res) => {
  try {
    res.json({
      endpoints: [
        "https://lightstreamer-api.vercel.app/api/discovery",
        "https://lightstreamer-api.vercel.app/api/enroll",
        "https://lightstreamer-api.vercel.app/api/send-command",
        "https://lightstreamer-api.vercel.app/api/update-command",
        "https://lightstreamer-api.vercel.app/api/pending-commands",
      ],
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Error fetching created IDs" });
  }
};

// API 2 - Create Unique ID
exports.createId = async (req, res) => {
  try {
    const { clientid } = req.body;

    if (!clientid) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    if (clientid.trim().length < 6) {
      return res
        .status(400)
        .json({ success: false, error: "ID length should be at least 6" });
    }

    // Check if ID already exists
    const existingMessage = await Message.findOne({ id: clientid });
    if (existingMessage) {
      return res.status(400).json({
        success: false,
        exists: true,
        message: "client exists",
      });
    }

    const message = new Message({
      id: clientid,
      status: "pending",
      commands: [],
    });
    await message.save();

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error creating ID" });
  }
};

// API 3 - Send Command
exports.sendCommand = async (req, res) => {
  try {
    const { id, command } = req.body;

    if (!id || !command) {
      return res
        .status(400)
        .json({ success: false, error: "ID and command are required" });
    }

    const newCommand = {
      id, // Generate a unique ID for the command
      command,
      createdAt: new Date(),
    };

    const message = await Message.findOneAndUpdate(
      { id },
      {
        $push: { commands: newCommand }, // Add new command to the commands array
        status: "unused", // Update status to "unused"
      },
      { new: true }
    );

    if (!message)
      return res.status(404).json({ success: false, error: "ID not found" });

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error sending command" });
  }
};

// API 4 - Process Command & Send to LightStreamer
exports.processCommand = async (req, res) => {
  try {
    const { id } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    // Find the message in MongoDB
    const message = await Message.findOne({ id });
    if (!message)
      return res.status(404).json({ success: false, error: "ID not found" });

    // Ensure there are commands in the array
    if (!message.commands.length) {
      return res
        .status(400)
        .json({ success: false, error: "No commands available" });
    }

    // Get the latest command
    const latestCommand = message.commands[message.commands.length - 1].command;

    // Update status to 'used'
    await Message.findOneAndUpdate({ id }, { status: "used" });

    res.json({
      success: true,
      "latest command": latestCommand,
      message: "Command processed",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to process command" });
  }
};

// API 5 - Get Pending Commands
exports.getPendingCommands = async (req, res) => {
  try {
    // Find messages where status is "unused"
    const pendingMessages = await Message.find({ status: "unused" });

    res.json({ success: true, pending: pendingMessages });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Error fetching pending commands" });
  }
};
