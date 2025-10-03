const mongoose = require('mongoose');

const { Schema } = mongoose;

const expectedWeatherSchema = new Schema(
  {
    avgTemp: Number,
    conditions: [String],
  },
  { _id: false }
);

const recommendedItemSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'ClothingItem', required: true },
    reason: String,
    dayCount: Number,
  },
  { _id: false }
);

const packingListSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripName: { type: String, required: true },
    destination: String,
    startDate: Date,
    endDate: Date,
    numberOfDays: Number,
    expectedWeather: expectedWeatherSchema,
    recommendedItems: [recommendedItemSchema],
    suggestedOutfits: [{ type: Schema.Types.ObjectId, ref: 'Outfit' }],
    status: { type: String, enum: ['draft', 'finalized', 'archived'], default: 'draft' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

packingListSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PackingList', packingListSchema);
