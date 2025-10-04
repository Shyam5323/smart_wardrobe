const path = require('path');
const fs = require('fs/promises');

const { ClothingItem } = require('../models');
const { analyzeItemFromPath, generateBackgroundRemovedImage } = require('../services/wolfram');
const { formatItemForResponse } = require('../utils/itemResponse');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const inferContentType = (ext, fallback) => {
  const normalized = typeof ext === 'string' ? ext.toLowerCase() : '';
  if (normalized === '.png') return 'image/png';
  if (normalized === '.jpg' || normalized === '.jpeg') return 'image/jpeg';
  if (normalized === '.webp') return 'image/webp';
  if (normalized === '.gif') return 'image/gif';
  if (normalized === '.bmp') return 'image/bmp';
  return fallback;
};

const storeAiSuccess = async (itemId, aiTags) => {
  try {
    const item = await ClothingItem.findById(itemId);
    if (!item) {
      return;
    }

    item.aiTags = aiTags;

    if (!item.category && aiTags?.primaryCategory) {
      item.category = aiTags.primaryCategory;
    }

    if (!item.color && aiTags?.dominantColor) {
      item.color = aiTags.dominantColor;
    }

    await item.save();
  } catch (error) {
    console.error('Failed to persist AI analysis results:', error);
  }
};

const storeAiFailure = async (itemId, error) => {
  try {
    const message = error instanceof Error ? error.message : String(error || 'Unknown AI failure');
    await ClothingItem.findByIdAndUpdate(itemId, {
      aiTags: {
        status: 'failed',
        source: 'wolfram',
        analyzedAt: new Date(),
        error: message,
      },
    });
  } catch (err) {
    console.error('Failed to persist AI analysis failure:', err);
  }
};

const scheduleAiAnalysis = (itemId, fileName) => {
  if (!itemId || !fileName) {
    return;
  }

  const imagePath = path.join(uploadsDir, fileName);

  analyzeItemFromPath(imagePath)
    .then((aiTags) => storeAiSuccess(itemId, aiTags))
    .catch((error) => {
      console.error('AI analysis failed:', error);
      return storeAiFailure(itemId, error);
    });
};

const normalizeInputString = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  if (value === null) {
    return null;
  }

  return undefined;
};

const applyStringField = (doc, field, value) => {
  const normalized = normalizeInputString(value);
  if (normalized === undefined) {
    return;
  }

  if (normalized === null) {
    doc[field] = undefined;
    return;
  }

  doc[field] = normalized;
};

const applyBooleanField = (doc, field, value) => {
  if (value === undefined) {
    return;
  }

  if (typeof value === 'boolean') {
    doc[field] = value;
    return;
  }

  if (value === 'true' || value === 'false') {
    doc[field] = value === 'true';
  }
};

const parsePurchasePriceInput = (value) => {
  if (value === undefined) {
    return { provided: false };
  }

  let working = value;

  if (Array.isArray(working)) {
    working = working[0];
  }

  if (typeof working === 'string') {
    const trimmed = working.trim();
    if (!trimmed) {
      return { provided: true, value: null };
    }
    working = trimmed;
  }

  if (working === null) {
    return { provided: true, value: null };
  }

  const numeric = Number.parseFloat(working);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric) || numeric < 0) {
    return {
      provided: true,
      error: 'Purchase price must be a non-negative number.',
    };
  }

  return {
    provided: true,
    value: Math.round(numeric * 100) / 100,
  };
};

const applyPurchasePriceField = (doc, value) => {
  const parsed = parsePurchasePriceInput(value);

  if (!parsed.provided) {
    return;
  }

  if (parsed.error) {
    const error = new Error(parsed.error);
    error.status = 400;
    throw error;
  }

  if (parsed.value === null) {
    doc.purchasePrice = undefined;
    return;
  }

  doc.purchasePrice = parsed.value;
};

const setUserTagField = (item, field, value) => {
  const normalized = normalizeInputString(value);
  if (normalized === undefined) {
    return false;
  }

  if (!item.userTags && normalized !== null) {
    item.userTags = {};
  }

  if (normalized === null) {
    if (item.userTags) {
      delete item.userTags[field];
    }
  } else {
    item.userTags = item.userTags || {};
    item.userTags[field] = normalized;
  }

  if (field === 'primaryCategory') {
    if (normalized === null) {
      item.category = item.aiTags?.primaryCategory || undefined;
    } else {
      item.category = normalized;
    }
  }

  if (field === 'dominantColor') {
    if (normalized === null) {
      item.color = item.aiTags?.dominantColor || undefined;
    } else {
      item.color = normalized;
    }
  }

  return true;
};

exports.uploadItem = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required to upload items.' });
    }

    const priceResult = parsePurchasePriceInput(req.body?.purchasePrice);
    if (priceResult.error) {
      return res.status(400).json({ message: priceResult.error });
    }

    const originalPath = path.join(uploadsDir, req.file.filename);
    let fileName = req.file.filename;
    let imageUrl = `/uploads/${req.file.filename}`;
    let fileSize = req.file.size;
    let contentType = req.file.mimetype;
    let processedTempPath;

    try {
      processedTempPath = await generateBackgroundRemovedImage(originalPath);

      if (processedTempPath) {
        const parsed = path.parse(req.file.filename);
        const ext = path.extname(processedTempPath) || parsed.ext || '.png';
        const newFileName = `${parsed.name}-bg-removed${ext}`;
        const destinationPath = path.join(uploadsDir, newFileName);

        await fs.copyFile(processedTempPath, destinationPath);
        await fs.unlink(originalPath).catch(() => {});

        fileName = newFileName;
        imageUrl = `/uploads/${newFileName}`;
        const stats = await fs.stat(destinationPath);
        fileSize = stats.size;
        contentType = inferContentType(ext, req.file.mimetype);
      }
    } catch (bgError) {
      console.warn('Background removal during upload failed:', bgError);
    } finally {
      if (processedTempPath) {
        await fs.unlink(processedTempPath).catch(() => {});
      }
    }

    const payload = {
      userId: req.userId,
      originalName: req.file.originalname,
      fileName,
      imageUrl,
      fileSize,
      contentType,
      aiTags: { status: 'processing', source: 'wolfram' },
    };

    if (priceResult.provided && priceResult.value !== null) {
      payload.purchasePrice = priceResult.value;
    }

    applyStringField(payload, 'notes', req.body?.notes);
    applyStringField(payload, 'customName', req.body?.customName);
    applyStringField(payload, 'category', req.body?.category);
    applyStringField(payload, 'color', req.body?.color);
    applyBooleanField(payload, 'isFavorite', req.body?.isFavorite);

    const item = await ClothingItem.create(payload);

    res.status(201).json({
      item: formatItemForResponse(req, item),
    });

    setImmediate(() => {
      scheduleAiAnalysis(item._id, item.fileName);
    });
  } catch (error) {
    next(error);
  }
};

exports.listItems = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required to view wardrobe items.' });
    }

    const items = await ClothingItem.find({
      userId: req.userId,
      isArchived: { $ne: true },
    }).sort({ uploadedAt: -1 });

    res.json({
      items: items.map((item) => formatItemForResponse(req, item)),
    });
  } catch (error) {
    next(error);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json({ item: formatItemForResponse(req, item) });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    applyStringField(item, 'customName', req.body?.customName);
    applyStringField(item, 'category', req.body?.category);
    applyStringField(item, 'color', req.body?.color);
    applyStringField(item, 'notes', req.body?.notes);
    applyBooleanField(item, 'isFavorite', req.body?.isFavorite);
    applyPurchasePriceField(item, req.body?.purchasePrice);

    await item.save();

    res.json({ item: formatItemForResponse(req, item) });
  } catch (error) {
    next(error);
  }
};

exports.logWear = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const rawCount = req.body?.count ?? 1;
    const parsedCount = Number.parseInt(rawCount, 10);

    if (!Number.isFinite(parsedCount) || Number.isNaN(parsedCount) || parsedCount <= 0) {
      return res.status(400).json({ message: 'count must be a positive integer.' });
    }

    const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    item.timesWorn = (item.timesWorn || 0) + parsedCount;
    item.markModified('timesWorn');

    await item.save();

    res.json({ item: formatItemForResponse(req, item) });
  } catch (error) {
    next(error);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.fileName) {
      const filePath = path.join(uploadsDir, item.fileName);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        if (unlinkError.code !== 'ENOENT') {
          console.warn('Failed to remove file:', unlinkError.message);
        }
      }
    }

    await item.deleteOne();

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.updateItemTags = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const { primaryCategory, dominantColor } = req.body || {};

    const touchedCategory = setUserTagField(item, 'primaryCategory', primaryCategory);
    const touchedColor = setUserTagField(item, 'dominantColor', dominantColor);

    if (!touchedCategory && !touchedColor) {
      return res.status(400).json({ message: 'No tag updates provided.' });
    }

    if (item.userTags && !item.userTags.primaryCategory && !item.userTags.dominantColor) {
      item.userTags = undefined;
    } else if (item.userTags) {
      item.userTags.updatedAt = new Date();
    }

    await item.save();

    res.json({ item: formatItemForResponse(req, item) });
  } catch (error) {
    next(error);
  }
};
