import express from 'express';
import { upload } from '../middleware/upload';
import { convertImage } from '../services/converter';
import path from 'path';
import fs from 'fs/promises';
import { io } from '../index';

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

interface ConvertRequest {
  files: Array<{ id: string; originalName: string; path: string }>;
  targetFormat: string;
  quality?: number;
}

router.post('/convert', async (req, res) => {
  const { files, targetFormat, quality = 85 }: ConvertRequest = req.body;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files to convert' });
  }

  const conversionId = Date.now().toString();

  // Start conversion process
  convertFiles(files, targetFormat, quality, conversionId);

  res.json({ conversionId, message: 'Conversion started' });
});

async function convertFiles(
  files: Array<{ id: string; originalName: string; path: string }>,
  targetFormat: string,
  quality: number,
  conversionId: string
) {
  let completed = 0;

  for (const file of files) {
    try {
      const outputPath = path.join('tmp/converted', `${file.id}.${targetFormat}`);

      // Emit progress
      io.emit(`progress:${conversionId}`, {
        fileId: file.id,
        progress: 0,
        status: 'converting'
      });

      // Convert
      const result = await convertImage({
        inputPath: file.path,
        outputPath,
        targetFormat,
        quality
      });

      if (result.success) {
        completed++;
        io.emit(`progress:${conversionId}`, {
          fileId: file.id,
          progress: 100,
          status: 'completed',
          outputPath
        });
      } else {
        io.emit(`progress:${conversionId}`, {
          fileId: file.id,
          progress: 0,
          status: 'error',
          error: result.error
        });
      }
    } catch (error: any) {
      io.emit(`progress:${conversionId}`, {
        fileId: file.id,
        progress: 0,
        status: 'error',
        error: error.message
      });
    }
  }
}

export default router;
