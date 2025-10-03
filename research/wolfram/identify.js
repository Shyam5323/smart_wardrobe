#!/usr/bin/env node

import 'dotenv/config';
import process from 'node:process';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const DEFAULT_ENDPOINT = process.env.WOLFRAM_API_URL || 'https://api.wolframalpha.com/v2/query';
const MAX_DIMENSION = Number(process.env.WOLFRAM_MAX_DIMENSION) || 256;
const TARGET_FORMAT = 'jpeg';

function parseArgs(argv) {
  const options = {
    top: 3,
    raw: false,
    dryRun: false,
    help: false,
    file: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--url':
      case '-u':
        options.url = argv[i + 1];
        i += 1;
        break;
      case '--top':
      case '-t':
        options.top = parseInt(argv[i + 1], 10) || options.top;
        i += 1;
        break;
      case '--raw':
        options.raw = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--file':
      case '-f':
        options.file = argv[i + 1];
        i += 1;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

function printUsage() {
  console.log(`Usage: node identify.js (--url <https image url> | --file <local path>) [options]\n\nOptions:\n  --url, -u      Remote image URL to classify\n  --file, -f     Local file path to an image (alternative to --url)\n  --top, -t      Limit how many identifications to keep (default: 3)\n  --raw          Print the full Wolfram JSON payload\n  --dry-run      Show the query without calling the API\n  --help, -h     Display this help message`);
}

async function optimizeImageBuffer(buffer) {
  try {
    const image = sharp(buffer, { failOn: 'none' });
    const metadata = await image.metadata();

    let pipeline = image;
    if ((metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside'
      });
    }

    const outputBuffer = await pipeline.jpeg({ quality: 80 }).toBuffer();
    return {
      buffer: outputBuffer,
      format: 'JPEG',
      width: metadata.width,
      height: metadata.height,
      originalBytes: buffer.byteLength,
      optimizedBytes: outputBuffer.byteLength
    };
  } catch (error) {
    console.warn('Warning: unable to optimize image, using original buffer.', error.message);
    return {
      buffer,
      format: 'JPEG',
      width: null,
      height: null,
      originalBytes: buffer.byteLength,
      optimizedBytes: buffer.byteLength
    };
  }
}

async function loadLocalImageBuffer(filePath) {
  if (!filePath) {
    throw new Error('Missing local file path when attempting to load an image.');
  }

  const buffer = await fs.readFile(filePath);
  return optimizeImageBuffer(buffer);
}

function normalizeConfidence(value) {
  if (value == null || Number.isNaN(value)) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  if (numeric > 1) {
    const percent = numeric / 100;
    if (percent <= 1) {
      return Number(percent.toFixed(4));
    }
  }
  return Number(Math.min(1, Math.max(0, numeric)).toFixed(4));
}

function extractCandidates(queryResult, limit = 3) {
  const pods = queryResult?.pods ?? [];
  if (!Array.isArray(pods) || pods.length === 0) return [];

  const candidatePod = pods.find((pod) => {
    const id = pod.id?.toLowerCase() ?? '';
    const title = pod.title?.toLowerCase() ?? '';
    return id.includes('imageidentify') || title.includes('identification') || title.includes('result');
  }) || pods[0];

  const lines = candidatePod.subpods?.flatMap((subpod) => {
    if (!subpod?.plaintext) return [];
    return subpod.plaintext
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }) ?? [];

  const candidates = lines.map((line) => {
    const cleaned = line.replace(/^\d+\.\s*/, '').replace(/→/g, '->');
    const confidenceMatch = cleaned.match(/^(.*?)(?:\s*\(([-+]?\d*\.?\d+%?)\))?$/);
    let label = cleaned;
    let confidence = null;

    if (confidenceMatch) {
      const [, rawLabel, rawConfidence] = confidenceMatch;
      label = rawLabel?.trim() ?? cleaned;
      if (rawConfidence) {
        const numeric = rawConfidence.endsWith('%')
          ? parseFloat(rawConfidence) / 100
          : parseFloat(rawConfidence);
        confidence = normalizeConfidence(numeric);
      }
    }

    return {
      label,
      confidence
    };
  });

  if (limit && Number.isInteger(limit) && limit > 0) {
    return candidates.slice(0, limit);
  }

  return candidates;
}

async function run() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.url && !options.file) {
    console.error('Missing required image source. Provide either --url <https image url> or --file <local path>.');
    printUsage();
    process.exit(1);
  }

  if (options.url && !options.url.startsWith('http')) {
    console.error('The --url option must be an absolute HTTP(S) URL. For local files, use --file instead.');
    process.exit(1);
  }

  const appId = process.env.WOLFRAM_APP_ID;
  if (!appId && !options.dryRun) {
    console.error('WOLFRAM_APP_ID is not set. Add it to research/wolfram/.env before running identify.js');
    process.exit(1);
  }

  const usingRemoteUrl = Boolean(options.url);
  const sourceSummary = usingRemoteUrl ? `remote: ${options.url}` : `file: ${options.file}`;

  let imagePayload = null;
  let wolframQuery;

  if (usingRemoteUrl) {
    const sanitizedUrl = options.url.replace(/"/g, '\\"');
    wolframQuery = `ImageIdentify[ImageURL[\"${sanitizedUrl}\"]]`;
  } else {
    imagePayload = await loadLocalImageBuffer(options.file);
    const base64Image = imagePayload.buffer.toString('base64');
    wolframQuery = `ImageIdentify[ImportString[\"${base64Image}\", {\"Base64\", \"${imagePayload.format}\"}]]`;
  }

  if (options.dryRun) {
    console.log('Dry run: no request was sent.');
    console.log(JSON.stringify({
      endpoint: DEFAULT_ENDPOINT,
      appIdPresent: Boolean(appId),
      query: wolframQuery,
      mode: usingRemoteUrl ? 'url' : 'file',
      source: sourceSummary
    }, null, 2));
    process.exit(0);
  }

  let response;

  if (usingRemoteUrl) {
    const params = new URLSearchParams({
      appid: appId,
      input: wolframQuery,
      output: 'JSON',
      format: 'plaintext'
    });
    response = await fetch(`${DEFAULT_ENDPOINT}?${params.toString()}`);
  } else {
    const bodyParams = new URLSearchParams({
      input: wolframQuery,
      output: 'JSON',
      format: 'plaintext'
    });

    response = await fetch(`${DEFAULT_ENDPOINT}?appid=${encodeURIComponent(appId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (response.status === 404) {
      const combinedParams = new URLSearchParams({
        appid: appId,
        input: wolframQuery,
        output: 'JSON',
        format: 'plaintext'
      });

      response = await fetch(`${DEFAULT_ENDPOINT}?${combinedParams.toString()}`);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`Wolfram API request failed with status ${response.status}: ${response.statusText}`);
    console.error(text);
    process.exit(1);
  }

  const payload = await response.json();
  const { queryresult } = payload;

  

  if (!queryresult?.success) {
    const messages = [
      'Wolfram reported failure evaluating the query.',
      queryresult?.error?.msg,
      queryresult?.tips?.map((tip) => tip.text).join('\n')
    ].filter(Boolean);

    console.error(messages.join('\n'));
    if (options.raw) {
      console.log(JSON.stringify(payload, null, 2));
    }
    process.exit(1);
  }

  const candidates = extractCandidates(queryresult, options.top);
  const output = {
    source: sourceSummary,
    imageUrl: options.url ?? null,
    imageBytes: imagePayload?.optimizedBytes ?? null,
    originalBytes: imagePayload?.originalBytes ?? null,
    resizeTarget: usingRemoteUrl ? null : MAX_DIMENSION,
    candidates,
    metadata: {
      wolframSource: 'ImageIdentify',
      timedOut: queryresult?.timedout ?? [],
      assumptions: queryresult?.assumptions ?? null,
      evaluatedAt: new Date().toISOString()
    }
  };

  if (options.raw) {
    console.log('\n--- Raw Wolfram Response ---');
    console.log(JSON.stringify(payload, null, 2));
    console.log('--- End Raw Response ---\n');
  }

  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error('Unexpected error while calling Wolfram API:');
  console.error(error);
  process.exit(1);
});
