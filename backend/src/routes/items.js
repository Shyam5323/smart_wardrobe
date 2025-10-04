const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const itemController = require('../controllers/itemController');
const authenticate = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1e6)}`;
    const extension = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES || 5 * 1024 * 1024),
  },
});

router.get('/', authenticate, itemController.listItems);
router.post('/upload', authenticate, upload.single('image'), itemController.uploadItem);
router.get('/wear/logs', authenticate, itemController.listWearLogs);
router.get('/:id', authenticate, itemController.getItem);
router.put('/:id/tags', authenticate, itemController.updateItemTags);
router.post('/:id/wear', authenticate, itemController.logWear);
router.put('/:id', authenticate, itemController.updateItem);
router.delete('/:id', authenticate, itemController.deleteItem);

module.exports = router;
