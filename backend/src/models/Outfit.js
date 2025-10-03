const mongoose = require('mongoose');

const { Schema } = mongoose;

const outfitItemSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'ClothingItem', required: true },
    category: String,
  },
  { _id: false }
);

const weatherSchema = new Schema(
  {
    temperature: Number,
    condition: String,
    generatedFor: Date,
  },
  { _id: false }
);

const outfitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: String,
    items: [outfitItemSchema],
    occasion: String,
    season: String,
    weather: weatherSchema,
    generationMethod: String,
    aiReasoning: String,
    isSaved: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    communityPollId: { type: Schema.Types.ObjectId, ref: 'CommunityPoll' },
    wornOn: [Date],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

outfitSchema.index({ userId: 1, isSaved: 1 });
outfitSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Outfit', outfitSchema);
