const { LightstreamerClient } = require("lightstreamer-client-node");
const Message = require("../models/Message");
const { v4: uuidv4 } = require("uuid");

// API 1 - Get API List
exports.getApiList = async (req, res) => {
  try {
    // Fetch all IDs from the database
    const messages = await Message.find({}, "id");
    const ids = messages.map((msg) => msg.id);

    res.json({
      endpoints: [
        "https://lightstreamer-api.vercel.app/api/create-id",
        "https://lightstreamer-api.vercel.app/api/send-command",
        "https://lightstreamer-api.vercel.app/api/process-command",
        "https://lightstreamer-api.vercel.app/api/pending-commands",
      ],
      createdIds: ids, // Add created IDs to the response
    });
  } catch (error) {
    console.error("Error fetching created IDs:", error);
    res.status(500).json({ error: "Error fetching created IDs" });
  }
};


// API 2 - Create Unique ID
exports.createId = async (req, res) => {
  try {
    const newId = uuidv4().replace(/-/g, "").slice(0, 10); // Generate unique alphanumeric ID
    const message = new Message({ id: newId, command: "" });
    await message.save();
    res.json({ success: true, id: newId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating ID" });
  }
};

// API 3 - Send Command
exports.sendCommand = async (req, res) => {
  try {
    const { id, command } = req.body;
    const message = await Message.findOneAndUpdate(
      { id },
      { command },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: "ID not found" });
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: "Error sending command" });
  }
};

// API 4 - Process Command & Send to LightStreamer
exports.processCommand = async (req, res) => {
  try {
    const { id, command } = req.body;

    // Validate input
    if (!id || !command) {
      return res.status(400).json({ error: "ID and command are required" });
    }

    // Find the message in MongoDB
    const message = await Message.findOne({ id });
    if (!message) return res.status(404).json({ error: "ID not found" });

    const client = new LightstreamerClient("http://localhost:8080", "WELCOME");

    // Wait for the connection to establish
    await new Promise((resolve, reject) => {
      let timeout = setTimeout(() => {
        reject(new Error("LightStreamer connection timeout"));
      }, 5000); // Timeout after 5 seconds

      client.addListener({
        onStatusChange: (status) => {
          console.log("LightStreamer status:", status);

          if (status.startsWith("CONNECTED")) {
            clearTimeout(timeout);
            resolve();
          } else if (
            status.startsWith("DISCONNECTED") ||
            status.startsWith("ERROR")
          ) {
            reject(new Error(`LightStreamer connection failed: ${status}`));
          }
        },
      });

      client.connect();
    });

    // Send the command message
    client.sendMessage(command, {
      onProcessed: () => {
        console.log("Message sent successfully:", command);
        res.json({ success: true, message: "Command sent" });

        // Disconnect client after sending message
        client.disconnect();
      },
      onError: (original, code, message) => {
        console.error("Error sending message:", message);
        res.status(500).json({ error: "Message sending failed" });
        client.disconnect();
      },
      onAbort: (original, code, message) => {
        console.error("Message aborted:", message);
        res.status(500).json({ error: "Message aborted" });
        client.disconnect();
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process command" });
  }
};

// API 5 - Get Pending Commands
exports.getPendingCommands = async (req, res) => {
  try {
    const pendingMessages = await Message.find({ received: false });
    res.json({ success: true, pending: pendingMessages });
  } catch (error) {
    res.status(500).json({ error: "Error fetching pending commands" });
  }
};
