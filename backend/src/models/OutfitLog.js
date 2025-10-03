const mongoose = require('mongoose');

const { Schema } = mongoose;

const outfitLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    outfitId: { type: Schema.Types.ObjectId, ref: 'Outfit', required: true },
    itemsWorn: [{ type: Schema.Types.ObjectId, ref: 'ClothingItem' }],
    notes: String,
    mood: String,
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

outfitLogSchema.index({ userId: 1, date: -1 });
outfitLogSchema.index({ itemsWorn: 1 });

module.exports = mongoose.model('OutfitLog', outfitLogSchema);
