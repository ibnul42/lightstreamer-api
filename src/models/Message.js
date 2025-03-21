const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["pending", "used", "unused"],
    default: "pending",
  },
  commands: [
    {
      id: { type: String, required: true },
      command: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
