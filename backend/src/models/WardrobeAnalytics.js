const mongoose = require('mongoose');

const { Schema } = mongoose;

const itemsByCategorySchema = new Schema(
  {
    tops: { type: Number, default: 0 },
    bottoms: { type: Number, default: 0 },
    dresses: { type: Number, default: 0 },
    outerwear: { type: Number, default: 0 },
    shoes: { type: Number, default: 0 },
    accessories: { type: Number, default: 0 },
  },
  { _id: false }
);

const recommendationSchema = new Schema(
  {
    itemType: String,
    reason: String,
    potentialOutfits: Number,
  },
  { _id: false }
);

const wardrobeAnalyticsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalItems: { type: Number, default: 0 },
    itemsByCategory: itemsByCategorySchema,
    averageCostPerWear: Number,
    totalSpent: Number,
    totalWears: Number,
    itemsOver30Wears: Number,
    mostWornItems: [{ type: Schema.Types.ObjectId, ref: 'ClothingItem' }],
    leastWornItems: [{ type: Schema.Types.ObjectId, ref: 'ClothingItem' }],
    unwornItems: [{ type: Schema.Types.ObjectId, ref: 'ClothingItem' }],
    dominantColors: [String],
    missingColors: [String],
    recommendations: [recommendationSchema],
    sustainabilityScore: Number,
    lastCalculated: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('WardrobeAnalytics', wardrobeAnalyticsSchema);
