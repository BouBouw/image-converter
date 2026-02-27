import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/bmp', 'image/tiff', 'image/x-icon', 'image/svg+xml',
    'application/pdf', 'image/vnd.adobe.photoshop'
  ];
  cb(null, allowedMimes.includes(file.mimetype));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
