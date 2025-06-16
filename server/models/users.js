const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: String, // 'user' or 'assistant'
  content: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  designation: { type: String, default: '' }, // initial prompt
  chatHistory: [messageSchema],
  tokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    refresh_token_expires_in: Number,
    expiry_date: Number,
  },
  pastReplies: [String],
  characterSummary:{
    tone: { type: String, default: "informal" },
    signature: { type: String, default: "Regards, [NAME]" },
    length: { type: String, default: "very short" },
    phrases: { type: [String], default: [] },
    emojis: { 
      used: {type: String, default: "false"},
      types: {type: [String], default:[]}
     },
     specifics: { type: [String], default: [] },
    additionalNotes: { type: String, default: "" }
  },
  lastRepliedTimestamp: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
