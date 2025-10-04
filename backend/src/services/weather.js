const crypto = require('crypto');

const isLocalAddress = (ip) => {
  if (!ip) return true;
  const normalized = ip.replace('::ffff:', '');
  return (
    normalized === '::1' ||
    normalized === '127.0.0.1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('172.16.') ||
    normalized === '0.0.0.0'
  );
};

const resolveClientIp = (req) => {
  const header = req.headers['x-forwarded-for'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};

let cachedFetch;
const getFetch = async () => {
  if (!cachedFetch) {
    const { default: fetchPolyfill } = await import('node-fetch');
    cachedFetch = fetchPolyfill;
  }
  return cachedFetch;
};

const fetchJson = async (url, options) => {
  const fetchFn = await getFetch();
  const response = await fetchFn(url, options);
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Request failed for ${url} (${response.status})`);
    error.status = response.status;
    error.details = text.slice(0, 500);
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const parseError = new Error('Failed to parse JSON response');
    parseError.status = 502;
    parseError.cause = error;
    parseError.details = text.slice(0, 500);
    throw parseError;
  }
};

const lookupLocation = async (req) => {
  const ip = resolveClientIp(req);

  if (isLocalAddress(ip)) {
    const lat = parseFloat(process.env.DEFAULT_WEATHER_LAT ?? '40.7128');
    const lon = parseFloat(process.env.DEFAULT_WEATHER_LON ?? '-74.0060');
    const city = process.env.DEFAULT_WEATHER_CITY ?? 'New York';
    const region = process.env.DEFAULT_WEATHER_REGION ?? 'NY';
    const country = process.env.DEFAULT_WEATHER_COUNTRY ?? 'US';

    return {
      source: 'fallback',
      ip,
      city,
      region,
      country,
      lat,
      lon,
    };
  }

  try {
    const data = await fetchJson(`http://ip-api.com/json/${ip}?fields=status,message,lat,lon,city,regionName,country`);
    if (data.status === 'success') {
      return {
        source: 'ip-api',
        ip,
        city: data.city,
        region: data.regionName,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch (error) {
    console.warn('Location lookup failed:', error);
  }

  const lat = parseFloat(process.env.DEFAULT_WEATHER_LAT ?? '40.7128');
  const lon = parseFloat(process.env.DEFAULT_WEATHER_LON ?? '-74.0060');
  const city = process.env.DEFAULT_WEATHER_CITY ?? 'New York';
  const region = process.env.DEFAULT_WEATHER_REGION ?? 'NY';
  const country = process.env.DEFAULT_WEATHER_COUNTRY ?? 'US';

  return {
    source: 'fallback',
    ip,
    city,
    region,
    country,
    lat,
    lon,
  };
};

const fetchCurrentWeather = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const error = new Error('Server misconfiguration: missing OPENWEATHER_API_KEY.');
    error.status = 500;
    throw error;
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', apiKey);

  const data = await fetchJson(url.toString());

  const kelvinToFahrenheit = (tempKelvin) => (tempKelvin - 273.15) * 1.8 + 32;
  const metricTemp = typeof data.main?.temp === 'number' ? data.main.temp : null;
  const fahrenheitTemp = typeof data.main?.temp === 'number' ? (metricTemp * 9) / 5 + 32 : null;

  return {
    raw: data,
    temperatureC: metricTemp,
    temperatureF: fahrenheitTemp,
    feelsLikeC: typeof data.main?.feels_like === 'number' ? data.main.feels_like : null,
    humidity: data.main?.humidity,
    pressure: data.main?.pressure,
    windSpeed: data.wind?.speed,
    description: data.weather?.[0]?.description,
    icon: data.weather?.[0]?.icon,
    conditions: data.weather?.[0]?.main,
    daylight: {
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toISOString() : null,
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toISOString() : null,
    },
    timestamp: data.dt ? new Date(data.dt * 1000).toISOString() : new Date().toISOString(),
  };
};

const buildPlaceholderOutfit = (weather) => {
  const bases = ['casual', 'smart casual', 'lounge', 'sporty'];
  const tops = ['Crew-neck tee', 'Lightweight hoodie', 'Button-down shirt', 'Sweatshirt'];
  const bottoms = ['Slim jeans', 'Chino shorts', 'Tailored trousers', 'Joggers'];
  const extras = ['Light jacket', 'Denim jacket', 'Waterproof shell', 'Cardigan'];

  const pick = (list) => list[crypto.randomInt(list.length)];

  return {
    summary: `${pick(bases)} look with ${pick(tops).toLowerCase()} and ${pick(bottoms).toLowerCase()}`,
    items: [pick(tops), pick(bottoms), pick(extras)],
    reason: weather?.description
      ? `Weather service fetched ${weather.description}. Outfit logic pending.`
      : 'Weather lookup succeeded. Detailed outfit logic coming soon.',
  };
};

module.exports = {
  resolveClientIp,
  lookupLocation,
  fetchCurrentWeather,
  buildPlaceholderOutfit,
};
