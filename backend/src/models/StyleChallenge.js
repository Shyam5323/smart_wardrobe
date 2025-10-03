const mongoose = require('mongoose');

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    outfitId: { type: Schema.Types.ObjectId, ref: 'Outfit', required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const styleChallengeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    theme: String,
    startDate: Date,
    endDate: Date,
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    submissions: [submissionSchema],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

styleChallengeSchema.index({ isActive: 1, startDate: 1 });

module.exports = mongoose.model('StyleChallenge', styleChallengeSchema);
