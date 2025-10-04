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
    aiTags: {
      source: { type: String, trim: true },
      analyzedAt: { type: Date },
      primaryCategory: { type: String, trim: true },
      categories: [
        {
          label: { type: String, trim: true },
          confidence: { type: Number, min: 0, max: 1 },
        },
      ],
      dominantColor: { type: String, trim: true },
      colors: [
        {
          name: { type: String, trim: true },
          hex: { type: String, trim: true },
          rgb: {
            r: { type: Number, min: 0, max: 255 },
            g: { type: Number, min: 0, max: 255 },
            b: { type: Number, min: 0, max: 255 },
          },
        },
      ],
      raw: { type: Schema.Types.Mixed },
    },
    notes: String,
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    lastAccessedAt: Date,
    aiTags: { type: aiTagsSchema, default: undefined },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' },
  }
);

clothingItemSchema.index({ userId: 1, isArchived: 1 });

module.exports = mongoose.model('ClothingItem', clothingItemSchema);
