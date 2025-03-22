const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  clientid: { type: String, required: true, unique: true },
  commands: [
    {
      messageid: { type: String, unique: true, sparse: true }, // Unique message ID for each command
      message: { type: String }, // Renamed 'command' to 'message'
      status: { type: String },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
