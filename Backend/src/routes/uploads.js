import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  uploadHandler,
  listHistory,
  renameUpload,
  deleteUpload,
  getShare
} from '../controllers/uploadsController.js';

const router = express.Router();
const upload = multer({
  dest: 'tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post('/upload', requireAuth, upload.single('file'), uploadHandler);
router.get('/history', requireAuth, listHistory);
router.patch('/uploads/:id', requireAuth, express.json(), renameUpload);
router.delete('/uploads/:id', requireAuth, deleteUpload);

// Public share
router.get('/share/:shareId', getShare);

export default router;
