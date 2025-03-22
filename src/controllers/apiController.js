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
    res.status(500).json({ error: "Error fetching created IDs" });
  }
};

// API 2 - Create Unique ID
exports.createId = async (req, res) => {
  try {
    let { clientid, selfgenid } = req.body;

    // Validate if selfgenid is provided and is a boolean
    if (typeof selfgenid !== "boolean") {
      return res.status(400).json({ error: "selfgenid must be true or false" });
    }

    // If selfgenid is true, use the provided clientid, else generate a new one if empty
    if (!selfgenid) {
      if (!clientid || clientid.trim() === "") {
        clientid = uuidv4().replace(/-/g, "").slice(0, 10);
      } else {
        // If clientid is provided with selfgenid false, check if it exists
        const existingMessage = await Message.findOne({ clientid });
        if (!existingMessage) {
          return res.status(404).json({
            exists: false,
            message: "Client does not exist",
          });
        }
      }
    }

    // Check if the client ID already exists
    const existingMessage = await Message.findOne({ clientid });
    if (existingMessage) {
      return res.status(400).json({
        exists: true,
        message: "Client ID already exists",
      });
    }

    // Ensure messages have a default empty structure
    const message = new Message({
      clientid,
      messages: [],
    });

    await message.save();

    res.json({ success: true, clientid, selfgenid });
  } catch (error) {
    res.status(500).json({ error: "Error creating ID" });
  }
};


// API 3 - Send Command
exports.sendCommand = async (req, res) => {
  try {
    const { id, command } = req.body;

    if (!id || !command) {
      return res
        .status(400)
        .json({ error: "client id and command are required" });
    }

    const messageid = uuidv4().replace(/-/g, "").slice(0, 6);

    const newCommand = {
      messageid, // Generate a unique ID for the command
      message: command,
      status: "unused",
      createdAt: new Date(),
    };

    const message = await Message.findOneAndUpdate(
      { clientid: id },
      {
        $push: { commands: newCommand }, // Add new command to the commands array
      },
      { new: true }
    );

    if (!message) return res.status(404).json({ error: "ID not exist" });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error sending command" });
  }
};

// API 4 - Process Command & Send to LightStreamer
exports.processCommand = async (req, res) => {
  try {
    const { clientid, messageid } = req.body;

    // Validate input
    if (!clientid) {
      return res.status(400).json({ error: "clientid is required" });
    }

    if (!messageid) {
      return res.status(400).json({ error: "messageid is required" });
    }

    // Find the message document with the given clientid
    const message = await Message.findOne({ clientid });

    if (!message) {
      return res.status(404).json({ error: "ID not exist" });
    }

    // Find the command within the commands array
    const commandIndex = message.commands.findIndex(
      (cmd) => cmd.messageid === messageid
    );

    if (commandIndex === -1) {
      return res.status(404).json({ error: "messageid not exist" });
    }

    // Update the status of the found command
    message.commands[commandIndex].status = "used";

    // Save the updated document
    await message.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to process command" });
  }
};

// API 5 - Get Pending Commands
exports.getPendingCommands = async (req, res) => {
  try {
    const { clientid } = req.body;

    // Validate input
    if (!clientid) {
      return res.status(400).json({ error: "clientid is required" });
    }

    // Find the message document with the given clientid
    const message = await Message.findOne({ clientid });

    if (!message) {
      return res.status(404).json({ error: "clientid not exist" });
    }

    // Filter commands where status is 'unused'
    const pendingCommands = message.commands
      .filter((cmd) => cmd.status === "unused")
      .map(({ messageid, message }) => ({ messageid, message }));

    res.json({
      success: true,
      pendingCommands,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commands" });
  }
};
