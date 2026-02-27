import express from 'express';
import { upload } from '../middleware/upload';
import { convertImage } from '../services/converter';
import { createZip } from '../services/zipper';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
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

// Download single file
router.get('/download/:id', async (req, res) => {
  const { id } = req.params;
  const format = req.query.format as string;

  const filePath = path.join('tmp/converted', `${id}.${format}`);

  try {
    await fs.access(filePath);
    const stat = await fs.stat(filePath);

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.${format}"`);

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);

    // Delete after download
    fileStream.on('end', async () => {
      try {
        await fs.unlink(filePath);
        await fs.unlink(filePath.replace('converted', 'uploads'));
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Download all as ZIP
router.post('/download-all', async (req, res) => {
  const { files } = req.body;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files to download' });
  }

  const zipPath = path.join('tmp/converted', `download-${Date.now()}.zip`);
  const filePaths = files.map((f: any) => path.join('tmp/converted', f.outputPath));

  await createZip(filePaths, zipPath);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="images.zip"');

  const zipStream = createReadStream(zipPath);
  zipStream.pipe(res);

  zipStream.on('end', async () => {
    // Cleanup
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (err) {}
    }
    await fs.unlink(zipPath);
  });
});

export default router;
