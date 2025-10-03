const mongoose = require('mongoose');

const { Schema } = mongoose;

const coordinatesSchema = new Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    city: String,
    country: String,
    coordinates: coordinatesSchema,
  },
  { _id: false }
);

const sizeInfoSchema = new Schema(
  {
    top: String,
    bottom: String,
    shoes: String,
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    defaultStyle: String,
    sizeInfo: sizeInfoSchema,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true },
    profilePicture: String,
    location: locationSchema,
    preferences: preferencesSchema,
    sustainabilityScore: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('User', userSchema);
