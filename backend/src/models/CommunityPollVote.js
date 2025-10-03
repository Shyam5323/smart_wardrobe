const mongoose = require('mongoose');

const { Schema } = mongoose;

const communityPollVoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, ref: 'CommunityPoll', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    selectedOption: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: 'votedAt', updatedAt: false },
  }
);

communityPollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CommunityPollVote', communityPollVoteSchema);
