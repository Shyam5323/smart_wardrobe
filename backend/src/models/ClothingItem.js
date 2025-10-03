const mongoose = require('mongoose');

const { Schema } = mongoose;

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
