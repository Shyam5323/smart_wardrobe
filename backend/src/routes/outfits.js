const express = require('express');
const authenticate = require('../middleware/auth');
const outfitController = require('../controllers/outfitController');

const router = express.Router();

router.post('/generate-weather', authenticate, outfitController.generateWeatherOutfit);

module.exports = router;
