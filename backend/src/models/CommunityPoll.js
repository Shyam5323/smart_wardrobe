const mongoose = require('mongoose');

const { Schema } = mongoose;

const pollOptionSchema = new Schema(
  {
    outfitId: { type: Schema.Types.ObjectId, ref: 'Outfit' },
    imageUrl: String,
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const communityPollSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    question: { type: String, required: true },
    options: { type: [pollOptionSchema], validate: v => Array.isArray(v) && v.length > 0 },
    isAnonymous: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'closed', 'flagged'], default: 'active' },
    expiresAt: Date,
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

communityPollSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('CommunityPoll', communityPollSchema);
