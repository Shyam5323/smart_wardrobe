const express = require('express');
const authenticate = require('../middleware/auth');
const aiController = require('../controllers/aiController');
const styleAdvisorController = require('../controllers/styleAdvisorController');

const router = express.Router();

router.post('/analyze-item', authenticate, aiController.analyzeItem);
router.post('/style/combinations', authenticate, styleAdvisorController.generateCombinations);
router.post('/style/next-purchase', authenticate, styleAdvisorController.suggestNextPurchase);
router.post('/style/weather-outfit', authenticate, styleAdvisorController.generateWeatherAwareOutfit);

module.exports = router;
