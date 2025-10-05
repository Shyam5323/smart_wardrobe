const mongoose = require('mongoose');

const { Schema } = mongoose;

const wearLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'ClothingItem', required: true, index: true },
    count: { type: Number, default: 1, min: 1 },
    wornAt: { type: Date, default: Date.now, index: true },
    source: { type: String, enum: ['manual', 'auto'], default: 'manual' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

wearLogSchema.index({ userId: 1, wornAt: -1 });
wearLogSchema.index({ userId: 1, itemId: 1, wornAt: -1 });

module.exports = mongoose.model('WearLog', wearLogSchema);
