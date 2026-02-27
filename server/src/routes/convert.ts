import express from 'express';
import { upload } from '../middleware/upload';

const router = express.Router();

router.post('/upload', upload.array('files', 20), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const fileData = files.map(file => ({
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path
  }));

  res.json({ files: fileData });
});

export default router;
