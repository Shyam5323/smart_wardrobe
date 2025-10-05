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

const formatItemForResponse = (req, itemDoc) => {
  if (!itemDoc) return null;
  const item = itemDoc.toObject({ versionKey: false });
  item.imageUrl = buildPublicUrl(req, item.imageUrl);

  if (typeof item.timesWorn !== 'number') {
    item.timesWorn = 0;
  }

  if (typeof item.purchasePrice === 'number') {
    item.purchasePrice = Number(item.purchasePrice.toFixed(2));
  }

  if (item.aiTags?.raw) {
    delete item.aiTags.raw;
  }

  if (item.aiTags?.analyzedAt instanceof Date) {
    item.aiTags.analyzedAt = item.aiTags.analyzedAt.toISOString();
  }

  if (item.userTags?.updatedAt instanceof Date) {
    item.userTags.updatedAt = item.userTags.updatedAt.toISOString();
  }

  if (typeof item.purchasePrice === 'number' && item.purchasePrice < 0) {
    item.purchasePrice = undefined;
  }

  const price = typeof item.purchasePrice === 'number' ? item.purchasePrice : null;
  const wears = typeof item.timesWorn === 'number' ? item.timesWorn : 0;

  if (price !== null && wears > 0) {
    item.costPerWear = Number((price / wears).toFixed(2));
  } else {
    item.costPerWear = null;
  }

  return item;
};

module.exports = {
  buildPublicUrl,
  formatItemForResponse,
};
