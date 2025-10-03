const path = require('path');
const fs = require('fs/promises');

const { ClothingItem } = require('../models');

const buildPublicUrl = (req, filePath) => {
  if (!filePath) return null;
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (normalizedPath.startsWith('http')) {
    return normalizedPath;
  }

  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const formatItem = (req, itemDoc) => {
  const item = itemDoc.toObject({ versionKey: false });
  item.imageUrl = buildPublicUrl(req, item.imageUrl);
  return item;
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

exports.uploadItem = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required to upload items.' });
    }

    const payload = {
      userId: req.userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      imageUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      contentType: req.file.mimetype,
    };

    applyStringField(payload, 'notes', req.body?.notes);
    applyStringField(payload, 'customName', req.body?.customName);
    applyStringField(payload, 'category', req.body?.category);
    applyStringField(payload, 'color', req.body?.color);
    applyBooleanField(payload, 'isFavorite', req.body?.isFavorite);

    const item = await ClothingItem.create(payload);

    res.status(201).json({
      item: formatItem(req, item),
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
      items: items.map((item) => formatItem(req, item)),
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

    res.json({ item: formatItem(req, item) });
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

    await item.save();

    res.json({ item: formatItem(req, item) });
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
