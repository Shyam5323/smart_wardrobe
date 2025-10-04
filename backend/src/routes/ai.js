const express = require('express');
const authenticate = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/analyze-item', authenticate, aiController.analyzeItem);

module.exports = router;
