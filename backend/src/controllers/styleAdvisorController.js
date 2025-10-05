const { ClothingItem } = require('../models');
const { formatItemForResponse } = require('../utils/itemResponse');
const { callGemini } = require('../services/gemini');
const { lookupLocation, fetchCurrentWeather } = require('../services/weather');

const STYLE_SYSTEM_PROMPT = `You are Wardrobe Stylist, a fashion assistant who only recommends outfits using pieces the user already owns. Keep answers concise, insightful, and grounded in the provided inventory. Always respond with JSON that matches the requested schema exactly. Do not include markdown, prose, or additional commentary outside the JSON.`;

const ensureAuthenticatedWardrobe = async (req) => {
  if (!req.userId) {
    const error = new Error('Authentication required.');
    error.status = 401;
    throw error;
  }

  const items = await ClothingItem.find({ userId: req.userId }).sort({ updatedAt: -1 });
  if (!items.length) {
    const error = new Error('Add at least one wardrobe item to get stylist insights.');
    error.status = 400;
    throw error;
  }

  const formattedItems = items.map((doc) => formatItemForResponse(req, doc));

  const normalizedItems = formattedItems.map((item) => {
    const id = String(item._id);
    const preferredCategory = item.userTags?.primaryCategory || item.category || item.aiTags?.primaryCategory || null;
    const preferredColor = item.userTags?.dominantColor || item.color || item.aiTags?.dominantColor || null;
    const purchasePrice = typeof item.purchasePrice === 'number' ? Number(item.purchasePrice.toFixed(2)) : null;
    const timesWorn = typeof item.timesWorn === 'number' ? item.timesWorn : 0;
    const costPerWear = typeof item.costPerWear === 'number' ? Number(item.costPerWear.toFixed(2)) : null;

    return {
      id,
      name: item.customName || item.originalName || 'Wardrobe item',
      imageUrl: item.imageUrl || null,
      category: preferredCategory,
      color: preferredColor,
      notes: item.notes || null,
      isFavorite: Boolean(item.isFavorite),
      timesWorn,
      purchasePrice,
      costPerWear,
      ai: item.aiTags
        ? {
            status: item.aiTags.status || 'unknown',
            primaryCategory: item.aiTags.primaryCategory || null,
            dominantColor: item.aiTags.dominantColor || null,
          }
        : null,
    };
  });

  const lookup = new Map(normalizedItems.map((item) => [item.id, item]));

  return {
    normalizedItems,
    lookup,
  };
};

const serializeWardrobeForPrompt = (items) => JSON.stringify({
  wardrobe: items.map(({ imageUrl, ...rest }) => rest),
}, null, 2);

const sanitizeItemRefs = (itemRefs, lookup) => {
  if (!Array.isArray(itemRefs)) return [];
  return itemRefs
    .map((ref) => {
      const id = typeof ref === 'string' ? ref : String(ref?.id || '');
      if (!id) return null;
      const match = lookup.get(id);
      if (!match) return null;
      return {
        id,
        name: match.name,
        imageUrl: match.imageUrl,
        category: match.category,
        color: match.color,
        purchasePrice: match.purchasePrice,
        timesWorn: match.timesWorn,
        costPerWear: match.costPerWear,
        isFavorite: match.isFavorite,
        note: typeof ref === 'object' && ref?.note ? String(ref.note) : null,
        reason: typeof ref === 'object' && ref?.reason ? String(ref.reason) : null,
      };
    })
    .filter(Boolean);
};

const buildFallbackCombinations = (items) => {
  if (items.length < 2) {
    return [];
  }
  const sorted = [...items].sort((a, b) => (a.timesWorn ?? 0) - (b.timesWorn ?? 0));
  const combinations = [];
  for (let index = 0; index < Math.min(3, sorted.length - 1); index += 1) {
    const primary = sorted[index];
    const partner = sorted[(index + 1) % sorted.length];
    combinations.push({
      title: `Outfit ${index + 1}`,
      summary: `${primary.name} paired with ${partner.name} for a refreshed take on your closet favourites.`,
      occasion: 'Everyday casual',
      stylingTips: ['Balance textures and add an accessory you already own.'],
      items: [
        { id: primary.id, reason: 'Helps rotate lesser-worn pieces.' },
        { id: partner.id, reason: 'Complements the focal item for a cohesive look.' },
      ],
    });
  }
  return combinations;
};

const buildFallbackNextPurchase = (items) => {
  const categoryCounts = items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const sortedByCount = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1]);
  const [lowestCategory] = sortedByCount[0] || ['Versatile layers', 0];

  return [
    {
      title: `Consider adding more ${lowestCategory.toLowerCase()}`,
      rationale: `Your closet currently has limited ${lowestCategory.toLowerCase()} options. Introducing one more piece will unlock new outfit combinations.`,
      currentGaps: [`Only ${categoryCounts[lowestCategory] || 0} item(s) in this category.`],
      suggestedItems: [
        {
          name: lowestCategory === 'Uncategorized' ? 'Structured outer layer' : `${lowestCategory} in a different fabric`,
          category: lowestCategory === 'Uncategorized' ? 'Layering piece' : lowestCategory,
          reason: 'Boost versatility and allow more varied styling of existing pieces.',
        },
      ],
      budgetThoughts: 'Aim for a durable piece you can wear 20+ times to keep cost-per-wear low.',
    },
  ];
};

const buildFallbackWeatherOutfit = (items) => {
  if (!items.length) return null;
  const favourites = items.filter((item) => item.isFavorite) || [];
  const sortedByWear = [...(favourites.length ? favourites : items)].sort(
    (a, b) => (a.timesWorn ?? 0) - (b.timesWorn ?? 0)
  );
  const selection = sortedByWear.slice(0, Math.min(3, sortedByWear.length));
  return {
    title: 'Everyday fallback look',
    summary: 'Combine comfortable staples from your wardrobe with layered accessories for adaptable weather.',
    stylingTips: ['Add weather-appropriate footwear you already own.', 'Layer with a scarf or light jacket if temperatures drop.'],
    items: selection.map((item) => ({
      id: item.id,
      reason: item.isFavorite ? 'Go-to favourite that suits many occasions.' : 'Helps rebalance wear frequency.',
    })),
  };
};

const includeMeta = (payload, meta = {}) => ({
  ...payload,
  meta: {
    provider: 'gemini',
    model: meta.model || process.env.GEMINI_MODEL || 'models/gemini-1.5-flash-latest',
    generatedAt: new Date().toISOString(),
    usedFallback: Boolean(meta.usedFallback),
    ...(process.env.NODE_ENV !== 'production' && meta.rawText ? { rawText: meta.rawText } : {}),
  },
});

exports.generateCombinations = async (req, res, next) => {
  try {
    const { normalizedItems, lookup } = await ensureAuthenticatedWardrobe(req);

    const prompt = `Wardrobe dataset (JSON):\n${serializeWardrobeForPrompt(normalizedItems)}\n\nTask: Propose exactly three standout outfit combinations using only the items above. Mix categories thoughtfully and prefer rotating pieces with low wear counts when possible.\n\nRespond with JSON in the following schema:\n{\n  "combinations": [\n    {\n      "title": string,\n      "summary": string,\n      "occasion": string,\n      "items": [ { "id": string, "reason": string } ],\n      "stylingTips": string[]\n    }\n  ]\n}\nDo not include markdown. Ensure every id exists in the wardrobe dataset.`;

    const aiResult = await callGemini({
      systemPrompt: STYLE_SYSTEM_PROMPT,
      userPrompt: prompt,
      generationConfig: { temperature: 0.65, maxOutputTokens: 2048 },
    });

    let combinations = Array.isArray(aiResult.parsed?.combinations)
      ? aiResult.parsed.combinations
      : [];

    let usedFallback = false;

    if (!combinations.length) {
      combinations = buildFallbackCombinations(normalizedItems);
      usedFallback = true;
    }

    const resolved = combinations
      .map((combo) => {
        const items = sanitizeItemRefs(combo.items, lookup);
        if (!items.length) return null;
        return {
          title: combo.title || 'Untitled outfit',
          summary: combo.summary || 'Curated look using pieces from your wardrobe.',
          occasion: combo.occasion || 'Casual',
          stylingTips: Array.isArray(combo.stylingTips) ? combo.stylingTips.map(String) : [],
          items,
        };
      })
      .filter(Boolean);

    res.json(
      includeMeta(
        {
          combinations: resolved,
        },
        { model: aiResult.model, usedFallback, rawText: aiResult.text }
      )
    );
  } catch (error) {
    next(error);
  }
};

exports.suggestNextPurchase = async (req, res, next) => {
  try {
    const { normalizedItems } = await ensureAuthenticatedWardrobe(req);

    const prompt = `Wardrobe dataset (JSON):\n${serializeWardrobeForPrompt(normalizedItems)}\n\nTask: Recommend up to three smart next purchases that fill gaps in this wardrobe. Focus on versatility, cost-per-wear potential, and balancing overused versus underused categories.\n\nRespond with JSON matching this schema:\n{\n  "recommendations": [\n    {\n      "title": string,\n      "rationale": string,\n      "currentGaps": string[],\n      "suggestedItems": [ { "name": string, "category": string | null, "reason": string } ],\n      "budgetThoughts": string\n    }\n  ]\n}\nDo not include markdown. These are shopping ideas only—do not claim specific brands.`;

    const aiResult = await callGemini({
      systemPrompt: STYLE_SYSTEM_PROMPT,
      userPrompt: prompt,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1536 },
    });

    let recommendations = Array.isArray(aiResult.parsed?.recommendations)
      ? aiResult.parsed.recommendations
      : [];

    let usedFallback = false;

    if (!recommendations.length) {
      recommendations = buildFallbackNextPurchase(normalizedItems);
      usedFallback = true;
    }

    const normalizedRecommendations = recommendations.map((rec) => ({
      title: rec.title || 'Thoughtful addition',
      rationale: rec.rationale || 'Helps maximise your existing pieces.',
      currentGaps: Array.isArray(rec.currentGaps) ? rec.currentGaps.map(String) : [],
      suggestedItems: Array.isArray(rec.suggestedItems)
        ? rec.suggestedItems.map((item) => ({
            name: item.name || 'Wardrobe staple',
            category: item.category || null,
            reason: item.reason || 'Complements multiple outfits you already own.',
          }))
        : [],
      budgetThoughts: rec.budgetThoughts ||
        'Allocate budget toward quality fabrics that withstand frequent wear.',
    }));

    res.json(
      includeMeta(
        {
          recommendations: normalizedRecommendations,
        },
        { model: aiResult.model, usedFallback, rawText: aiResult.text }
      )
    );
  } catch (error) {
    next(error);
  }
};

exports.generateWeatherAwareOutfit = async (req, res, next) => {
  try {
    const { normalizedItems, lookup } = await ensureAuthenticatedWardrobe(req);

    const location = await lookupLocation(req);
    const weather = await fetchCurrentWeather(location.lat, location.lon);

    const weatherSummary = {
      location: `${location.city || 'Unknown city'}, ${location.region || location.country || ''}`.trim(),
      temperatureC: weather.temperatureC,
      feelsLikeC: weather.feelsLikeC,
      conditions: weather.conditions,
      description: weather.description,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
    };

    const prompt = `Wardrobe dataset (JSON):\n${serializeWardrobeForPrompt(normalizedItems)}\n\nToday\'s weather context (JSON):\n${JSON.stringify(weatherSummary, null, 2)}\n\nTask: Create a single weather-aware outfit using only items from the wardrobe. If needed, mention accessories the user likely owns (e.g., neutral shoes) but emphasise the provided garments.\n\nRespond with JSON in this schema:\n{\n  "outfit": {\n    "title": string,\n    "summary": string,\n    "items": [ { "id": string, "reason": string } ],\n    "stylingTips": string[],\n    "weatherNotes": string\n  }\n}\nDo not include markdown. Reference only item ids that exist.`;

    const aiResult = await callGemini({
      systemPrompt: STYLE_SYSTEM_PROMPT,
      userPrompt: prompt,
      generationConfig: { temperature: 0.55, maxOutputTokens: 1536 },
    });

    let outfit = aiResult.parsed?.outfit || null;
    let usedFallback = false;

    if (!outfit) {
      outfit = buildFallbackWeatherOutfit(normalizedItems);
      usedFallback = true;
    }

    const items = outfit ? sanitizeItemRefs(outfit.items, lookup) : [];

    const normalizedOutfit = {
      title: outfit?.title || 'Weather-ready look',
      summary: outfit?.summary || 'An easy combination tailored to today\'s conditions.',
      stylingTips: Array.isArray(outfit?.stylingTips) ? outfit.stylingTips.map(String) : [],
      weatherNotes: outfit?.weatherNotes ||
        `Expect ${weather.description || weather.conditions || 'current weather conditions'}. Adjust layers as needed.`,
      items,
    };

    if (!items.length) {
      normalizedOutfit.items = sanitizeItemRefs(buildFallbackWeatherOutfit(normalizedItems)?.items || [], lookup);
      usedFallback = true;
    }

    res.json(
      includeMeta(
        {
          location,
          weather: weatherSummary,
          outfit: normalizedOutfit,
        },
        { model: aiResult.model, usedFallback, rawText: aiResult.text }
      )
    );
  } catch (error) {
    next(error);
  }
};
