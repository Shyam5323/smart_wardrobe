const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const FALLBACK_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001',
];
const DEFAULT_BASE_URL = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const callGemini = async ({ systemPrompt, userPrompt, generationConfig = {} }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Server misconfiguration: missing GEMINI_API_KEY.');
    error.status = 500;
    throw error;
  }

  if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
    throw new Error('userPrompt is required when calling Gemini.');
  }

  const { model: requestedModel, ...configWithoutModel } = generationConfig || {};

  const candidateModels = [
    requestedModel,
    process.env.GEMINI_MODEL,
    DEFAULT_MODEL,
    ...FALLBACK_MODELS,
  ]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  const baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, '');

  const fetchFn = await getFetch();
  let lastError;

  for (const model of candidateModels) {
    const normalizedModel = normalizeModelId(model);
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 1024,
        ...configWithoutModel,
      },
    };

    if (systemPrompt && systemPrompt.trim()) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt.trim() }],
      };
    }

  const url = `${baseUrl}/${normalizedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const response = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error?.message || `Gemini API request failed with status ${response.status}.`;
        const error = new Error(message);
        error.status = response.status;
        error.details = data?.error ?? data;

        if (response.status === 400 || response.status === 404) {
          lastError = error;
          continue;
        }

        throw error;
      }

      const text = extractTextFromResponse(data);

      return {
        raw: data,
        text,
        parsed: tryParseJson(text),
        model: normalizedModel,
      };
    } catch (error) {
      if (error.status === 400 || error.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  const finalError =
    lastError ||
    new Error('Gemini API request failed: no supported models responded successfully.');

  if (!process.env.GEMINI_MODEL) {
    finalError.details = {
      hint:
        'Run the ListModels method (https://ai.google.dev/api/rest/v1beta/models/list) or set GEMINI_MODEL to a supported ID.',
    };
  }

  throw finalError;
};
let cachedFetch;
const getFetch = async () => {
  if (typeof fetch === 'function') {
    return fetch;
  }
  if (!cachedFetch) {
    const { default: fetchPolyfill } = await import('node-fetch');
    cachedFetch = fetchPolyfill;
  }
  return cachedFetch;
};

const extractTextFromResponse = (data) => {
  if (!data?.candidates) return '';
  return data.candidates
    .flatMap((candidate) => candidate?.content?.parts ?? [])
    .map((part) => part?.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();
};

const tryParseJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    const firstJsonLike = text.match(/\{[\s\S]*\}/);
    if (!firstJsonLike) return null;
    try {
      return JSON.parse(firstJsonLike[0]);
    } catch (innerError) {
      return null;
    }
  }
};
  const normalizeModelId = (modelId) => {
    if (!modelId) return modelId;
    return modelId.includes('/') ? modelId : `models/${modelId}`;
  };



module.exports = {
  callGemini,
  tryParseJson,
  normalizeModelId,
};
