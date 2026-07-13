const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  reason: {
    type: String,
    enum: [
      "Fake Listing",
      "Spam",
      "Offensive Content",
      "Incorrect Information",
      "Duplicate Listing",
      "Fraudulent Activity",
      "Other"
    ],
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only report a listing once
reportSchema.index({ reporter: 1, listing: 1 }, { unique: true });

module.exports = mongoose.model("Report", reportSchema);
