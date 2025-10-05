const path = require('path');

const { ClothingItem } = require('../models');
const { analyzeItemFromPath, analyzeItemFromUrl } = require('../services/wolfram');
const { formatItemForResponse } = require('../utils/itemResponse');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const sanitizeAiTags = (aiTags) => {
  if (!aiTags) return aiTags;
  const sanitized = { ...aiTags };
  if (sanitized.raw) {
    delete sanitized.raw;
  }
  if (sanitized.analyzedAt instanceof Date) {
    sanitized.analyzedAt = sanitized.analyzedAt.toISOString();
  }
  if (Array.isArray(sanitized.colors)) {
    sanitized.colors = sanitized.colors.map((color) => ({ ...color }));
  }
  if (Array.isArray(sanitized.categories)) {
    sanitized.categories = sanitized.categories.map((category) => ({ ...category }));
  }
  return sanitized;
};

const resolveItemImagePath = (item) => {
  if (!item) return null;

  if (item.fileName) {
    return path.join(uploadsDir, item.fileName);
  }

  if (typeof item.imageUrl === 'string' && item.imageUrl.trim()) {
    const imageUrl = item.imageUrl.trim();
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    const normalized = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return path.join(__dirname, '..', '..', normalized);
  }

  return null;
};

const applyAnalysisToItem = async (item, aiTags) => {
  item.aiTags = aiTags;

  if (!item.category && aiTags?.primaryCategory) {
    item.category = aiTags.primaryCategory;
  }

  if (!item.color && aiTags?.dominantColor) {
    item.color = aiTags.dominantColor;
  }

  await item.save();
};

exports.analyzeItem = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication is required for AI analysis.' });
    }

    const { itemId, imageUrl } = req.body || {};

    if (!itemId && (!imageUrl || typeof imageUrl !== 'string')) {
      return res.status(400).json({ message: 'Provide an itemId or an imageUrl for analysis.' });
    }

    if (itemId) {
      const item = await ClothingItem.findOne({ _id: itemId, userId: req.userId });

      if (!item) {
        return res.status(404).json({ message: 'Clothing item not found.' });
      }

      let aiTags;

      if (imageUrl && imageUrl.trim()) {
        aiTags = await analyzeItemFromUrl(imageUrl.trim());
      } else {
        const sourcePath = resolveItemImagePath(item);

        if (!sourcePath) {
          return res.status(400).json({ message: 'No image available for analysis.' });
        }

        if (typeof sourcePath === 'string' && (sourcePath.startsWith('http://') || sourcePath.startsWith('https://'))) {
          aiTags = await analyzeItemFromUrl(sourcePath);
        } else {
          aiTags = await analyzeItemFromPath(sourcePath);
        }
      }

      await applyAnalysisToItem(item, aiTags);

      return res.json({
        aiTags: sanitizeAiTags(aiTags),
        item: formatItemForResponse(req, item),
      });
    }

    const analysis = await analyzeItemFromUrl(imageUrl.trim());

    return res.json({
      aiTags: sanitizeAiTags(analysis),
    });
  } catch (error) {
    next(error);
  }
};
