const fs = require('fs');
const fsPromises = require('fs/promises');
const FormData = require('form-data');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_IDENTIFY_ENDPOINT = 'https://www.wolframcloud.com/obj/shyammm53/ImageIdentifyAPI';
const DEFAULT_COLOR_ENDPOINT = 'https://www.wolframcloud.com/obj/shyammm53/clothing-color-name';
const DEFAULT_BACKGROUND_ENDPOINT = 'https://www.wolframcloud.com/obj/shyammm53/clothing-background-removal';

let cachedFetch;
const getFetch = async () => {
  if (!cachedFetch) {
    const { default: fetchPolyfill } = await import('node-fetch');
    cachedFetch = fetchPolyfill;
  }

  return cachedFetch;
};

const rgbToHSV = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === rn) {
      h = ((gn - bn) / diff + (gn < bn ? 6 : 0)) / 6;
    } else if (max === gn) {
      h = ((bn - rn) / diff + 2) / 6;
    } else {
      h = ((rn - gn) / diff + 4) / 6;
    }
  }

  return { h, s, v };
};

const classifyColor = ([r, g, b]) => {
  const { h, s, v } = rgbToHSV(r, g, b);

  if (s < 0.15) {
    if (v < 0.2) return 'Black';
    if (v < 0.4) return 'Dark Gray';
    if (v < 0.6) return 'Gray';
    if (v < 0.8) return 'Light Gray';
    return 'White';
  }

  if (h < 15 / 360 || h > 345 / 360) return 'Red';
  if (h < 45 / 360) return 'Orange';
  if (h < 75 / 360) return 'Yellow';
  if (h < 150 / 360) return 'Green';
  if (h < 200 / 360) return 'Cyan';
  if (h < 260 / 360) return 'Blue';
  if (h < 300 / 360) return 'Purple';
  if (h < 330 / 360) return 'Pink';
  return 'Red';
};

const rgbToHex = ([r, g, b]) => [r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase();

const parseWolframRGB = (text) => {
  const match = text.match(/RGBColor\[([^\]]+)\]/);
  if (!match) return null;

  const components = match[1]
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => {
      const numeric = Number.parseFloat(value);
      return Number.isNaN(numeric) ? null : numeric;
    })
    .filter((value) => value !== null);

  if (components.length < 3) {
    return null;
  }

  return components.slice(0, 3).map((value) => Math.round(value * 255));
};

const ensureFileReadable = async (imagePath) => {
  if (!imagePath) {
    const error = new Error('Missing image path for Wolfram analysis.');
    error.status = 400;
    throw error;
  }

  try {
    await fsPromises.access(imagePath, fs.constants.R_OK);
  } catch (err) {
    const error = new Error('Image file could not be read for AI analysis.');
    error.status = 404;
    error.cause = err;
    throw error;
  }
};

const createImageForm = (imagePath, { fieldName = 'image', filename } = {}) => {
  const form = new FormData();
  form.append(fieldName, fs.createReadStream(imagePath), filename || path.basename(imagePath));
  return form;
};

const resolveEndpoint = (envKey, fallback) => {
  const endpoint = process.env[envKey] || fallback;
  if (!endpoint) {
    const error = new Error(`Missing configuration for ${envKey}.`);
    error.status = 500;
    throw error;
  }
  return endpoint;
};

const resolveFileExtension = (contentType, imageUrl) => {
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('gif')) return '.gif';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('bmp')) return '.bmp';
  if (contentType?.includes('svg')) return '.svg';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';

  try {
    const parsed = new URL(imageUrl);
    const ext = path.extname(parsed.pathname);
    if (ext) {
      return ext;
    }
  } catch (error) {
    // Ignore URL parse issues and fall back to default
  }

  return '.img';
};

const downloadImageToTempFile = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    const error = new Error('imageUrl is required for Wolfram analysis.');
    error.status = 400;
    throw error;
  }

  const fetchFn = await getFetch();
  const response = await fetchFn(imageUrl);

  if (!response.ok) {
    const error = new Error(`Failed to download image for AI analysis (${response.status}).`);
    error.status = 400;
    error.details = await response.text().catch(() => undefined);
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    const error = new Error('Downloaded image is empty.');
    error.status = 400;
    throw error;
  }

  const tempFileName = `wardrobe-ai-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${resolveFileExtension(
    response.headers.get('content-type'),
    imageUrl
  )}`;

  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  await fsPromises.writeFile(tempFilePath, buffer);
  return tempFilePath;
};

const shouldRemoveBackground = () => {
  const flag = process.env.WOLFRAM_ENABLE_BACKGROUND_REMOVAL;
  return flag === undefined || flag.toLowerCase() === 'true' || flag === '1';
};

const generateBackgroundRemovedImage = async (imagePath) => {
  if (!shouldRemoveBackground()) {
    return null;
  }

  const fetchFn = await getFetch();
  const endpoint = resolveEndpoint('WOLFRAM_BG_REMOVAL_API', DEFAULT_BACKGROUND_ENDPOINT);
  const form = createImageForm(imagePath);
  form.append('model', 'Salient');
  form.append('quality', 'Standard');

  const response = await fetchFn(endpoint, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!response.ok) {
    const error = new Error(`Wolfram background removal failed (${response.status}).`);
    error.status = 502;
    error.details = buffer.toString('utf8', 0, 500);
    throw error;
  }

  if (!buffer.length) {
    const error = new Error('Background removal returned an empty file.');
    error.status = 502;
    throw error;
  }

  const tempFileName = `wardrobe-ai-bg-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${resolveFileExtension(
    response.headers.get('content-type'),
    imagePath
  )}`;

  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  await fsPromises.writeFile(tempFilePath, buffer);

  return tempFilePath;
};

const identifyClothingItem = async (imagePath) => {
  const fetchFn = await getFetch();
  const endpoint = resolveEndpoint('WOLFRAM_IDENTIFY_API', DEFAULT_IDENTIFY_ENDPOINT);
  const form = createImageForm(imagePath);

  const response = await fetchFn(endpoint, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const text = await response.text();

  if (!response.ok) {
    const error = new Error(`Wolfram identify request failed (${response.status}).`);
    error.status = 502;
    error.details = text.slice(0, 500);
    throw error;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    const error = new Error('Unable to parse Wolfram identify response.');
    error.status = 502;
    error.cause = err;
    error.details = text.slice(0, 500);
    throw error;
  }

  const categories = Object.entries(data)
    .filter((entry) => typeof entry[1] === 'number')
    .map(([label, confidence]) => ({ label, confidence }))
    .sort((a, b) => b.confidence - a.confidence);

  return { categories, raw: data };
};

const analyzeDominantColor = async (imagePath) => {
  const fetchFn = await getFetch();
  const endpoint = resolveEndpoint('WOLFRAM_COLOR_API', DEFAULT_COLOR_ENDPOINT);
  const form = createImageForm(imagePath);
  form.append('numColors', '5');

  const response = await fetchFn(endpoint, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const text = await response.text();

  if (!response.ok) {
    const error = new Error(`Wolfram color analysis failed (${response.status}).`);
    error.status = 502;
    error.details = text.slice(0, 500);
    throw error;
  }

  const rgb = parseWolframRGB(text);
  if (!rgb) {
    const error = new Error('Unable to extract RGB values from Wolfram color response.');
    error.status = 502;
    error.details = text.slice(0, 500);
    throw error;
  }

  const [r, g, b] = rgb;
  const colorName = classifyColor(rgb);
  const hex = `#${rgbToHex(rgb)}`;

  return {
    dominantColor: colorName,
    colors: [
      {
        name: colorName,
        hex,
        rgb: { r, g, b },
      },
    ],
    raw: text,
  };
};

const analyzeItemFromPath = async (imagePath) => {
  await ensureFileReadable(imagePath);

  let workingPath = imagePath;
  let cleanupPath;

  try {
  const processedPath = await generateBackgroundRemovedImage(imagePath);
    if (processedPath) {
      workingPath = processedPath;
      cleanupPath = processedPath;
    }
  } catch (error) {
    console.warn('Background removal failed, continuing with original image:', error);
  }

  try {
    const [identifyResult, colorResult] = await Promise.all([
      identifyClothingItem(workingPath),
      analyzeDominantColor(workingPath),
    ]);

    const analysis = {
      source: 'wolfram',
      analyzedAt: new Date(),
      status: 'complete',
      raw: {
        identify: identifyResult.raw,
        color: colorResult.raw,
      },
    };

    if (identifyResult.categories.length > 0) {
      analysis.categories = identifyResult.categories;
      analysis.primaryCategory = identifyResult.categories[0]?.label;
    }

    if (colorResult.dominantColor) {
      analysis.dominantColor = colorResult.dominantColor;
      analysis.colors = colorResult.colors;
    }

    return analysis;
  } finally {
    if (cleanupPath) {
      fsPromises.unlink(cleanupPath).catch(() => {});
    }
  }
};

const analyzeItemFromUrl = async (imageUrl) => {
  const tempPath = await downloadImageToTempFile(imageUrl);

  try {
    return await analyzeItemFromPath(tempPath);
  } finally {
    fsPromises.unlink(tempPath).catch(() => {});
  }
};

module.exports = {
  analyzeItemFromPath,
  analyzeItemFromUrl,
  generateBackgroundRemovedImage,
};
