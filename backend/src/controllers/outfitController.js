const { lookupLocation, fetchCurrentWeather, buildPlaceholderOutfit } = require('../services/weather');

exports.generateWeatherOutfit = async (req, res, next) => {
  try {
    const location = await lookupLocation(req);
    const weather = await fetchCurrentWeather(location.lat, location.lon);
    const suggestion = buildPlaceholderOutfit(weather);

    res.json({
      location,
      weather,
      suggestion,
    });
  } catch (error) {
    next(error);
  }
};
