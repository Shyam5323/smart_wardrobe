# Wolfram ImageIdentify Prototype

This directory holds a small, standalone sandbox for exploring how Wolfram's image-identification capabilities could plug into the wardrobe project without touching the main frontend or backend code. Remote URLs are passed directly to `ImageIdentify[ImageURL[...]]`, while local files are downsized (default max edge 256 px) and uploaded through the `ImportString[..., "Base64"]` fallback to stay under Wolfram's payload limits.

## What this does

* Sends a query to the Wolfram|Alpha HTTP API that wraps `ImageIdentify[Import["<image url>"]]`.
* Parses the JSON response to extract the most relevant identifications and confidence scores (when available).
* Normalizes the result into a shape that we can later store alongside wardrobe items (label, score, raw response).

## Quick start

```powershell
cd research/wolfram
npm install
# Set up your environment variables first (see below)
node identify.js --url "https://example.com/path/to/garment.jpg"
```

You can also point the script at a local file:

```powershell
node identify.js --file "C:\images\my-outfit.jpg"
```

### Environment

Copy `.env.example` to `.env` and fill in the values:

* `WOLFRAM_APP_ID` – your Wolfram|Alpha AppID (https://developer.wolframalpha.com/portal/myapps/index.html)
* `WOLFRAM_API_URL` – override only if you are routing through a custom Wolfram Cloud deployment (defaults to the public Wolfram|Alpha endpoint).
* `WOLFRAM_MAX_DIMENSION` – optional clamp on the longest image edge before upload when using `--file` (default: 256).

### CLI options

```
--url <https url>     Remote image URL to classify (optional if --file provided)
--file <path>         Local image path to upload (optional if --url provided)
--top <number>        Limit how many identifications are returned (default: 3)
--raw                 Print the full Wolfram JSON response to stdout
--dry-run             Skip the API call and just show the query that would be issued
```

If the service returns an error (bad AppID, unsupported image, etc.), the script exits with code 1 and prints the error message for quick debugging.

## Output shape

Successful responses are printed as pretty JSON:

```
{
  "imageUrl": "https://example.com/dress.jpg",
  "candidates": [
    {
      "label": "sundress",
      "confidence": 0.73
    },
    {
      "label": "day dress",
      "confidence": 0.62
    }
  ],
  "metadata": {
    "wolframSource": "ImageIdentify",
    "evaluatedAt": "2025-10-04T12:34:56.789Z"
  }
}
```

The `confidence` values are derived from Wolfram's textual output when possible. When Wolfram omits an explicit score, we return `null` for that field so the consumer can decide how to handle it.

## Next steps

* Wrap this script in an internal API (`POST /api/ai/analyze-item`) so uploads can request labels asynchronously.
* Extend the parser to capture bounding boxes if you later deploy a custom `ImageCases` Cloud API.
* Cache successful identifications locally to avoid repeated Wolfram calls during development.
