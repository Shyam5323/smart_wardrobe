const mongoose = require('mongoose');

const { Schema } = mongoose;

const aiColorSchema = new Schema(
  {
    name: { type: String, trim: true },
    hex: { type: String, uppercase: true, trim: true },
    rgb: {
      r: { type: Number, min: 0, max: 255 },
      g: { type: Number, min: 0, max: 255 },
      b: { type: Number, min: 0, max: 255 },
    },
  },
  { _id: false }
);

const aiCategorySchema = new Schema(
  {
    label: { type: String, trim: true },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const aiTagsSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['idle', 'processing', 'complete', 'failed'],
      default: 'idle',
    },
    source: { type: String, trim: true },
    analyzedAt: Date,
    primaryCategory: { type: String, trim: true },
    categories: [aiCategorySchema],
    dominantColor: { type: String, trim: true },
    colors: [aiColorSchema],
    error: { type: String, trim: true },
    raw: Schema.Types.Mixed,
  },
  { _id: false, minimize: false }
);

const userTagsSchema = new Schema(
  {
    primaryCategory: { type: String, trim: true },
    dominantColor: { type: String, trim: true },
    updatedAt: { type: Date },
  },
  { _id: false, minimize: false }
);

const clothingItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: String,
    fileName: { type: String },
    imageUrl: { type: String },
    fileSize: Number,
    contentType: String,
    customName: { type: String, trim: true },
    category: { type: String, trim: true },
    color: { type: String, trim: true },
  purchasePrice: { type: Number, min: 0 },
  timesWorn: { type: Number, min: 0, default: 0 },
    aiTags: { type: aiTagsSchema, default: undefined },
    userTags: { type: userTagsSchema, default: undefined },
    notes: String,
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    lastAccessedAt: Date,
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' },
  }
);

clothingItemSchema.index({ userId: 1, isArchived: 1 });

module.exports = mongoose.model('ClothingItem', clothingItemSchema);
