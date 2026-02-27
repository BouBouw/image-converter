# Image Converter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack image converter application with Express backend and React frontend, supporting all image formats with real-time progress tracking and batch download.

**Architecture:**
- **Backend:** Express API with Sharp (fast formats) + ImageMagick (exotic formats) hybrid conversion engine, WebSocket for real-time progress
- **Frontend:** React Vite with TailwindCSS, drag-and-drop upload, progress bars, individual/ZIP downloads

**Tech Stack:**
- Backend: Express, TypeScript, Multer, Sharp, ImageMagick, Socket.io, Archiver
- Frontend: React, TypeScript, TailwindCSS, Lucide Icons, Axios, Socket.io-client

---

## Phase 1: Backend Foundation

### Task 1: Initialize Backend Project

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`

**Step 1: Create package.json**

```bash
cd server
npm init -y
```

**Step 2: Install dependencies**

```bash
npm install express multer sharp socket.io cors archiver
npm install -D typescript @types/node @types/express @types/multer @types/cors ts-node nodemon
```

**Step 3: Create tsconfig.json**

Run: `cat > server/tsconfig.json << 'EOF'`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

**Step 4: Create Express server skeleton**

Run: `cat > server/src/index.ts << 'EOF'`
```typescript
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
EOF
```

**Step 5: Add dev scripts**

Run: `cat >> server/package.json << 'EOF'`
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
EOF
```

**Step 6: Test server startup**

Run: `cd server && npm run dev`
Expected: "Server running on port 3001"
Press Ctrl+C to stop

**Step 7: Commit**

```bash
git add server/
git commit -m "feat: initialize Express server with TypeScript and Socket.io"
```

---

### Task 2: Setup File Upload with Multer

**Files:**
- Create: `server/src/middleware/upload.ts`
- Create: `server/src/routes/convert.ts`
- Modify: `server/src/index.ts`

**Step 1: Create upload directory**

```bash
mkdir -p server/tmp/uploads server/tmp/converted
```

**Step 2: Create Multer configuration**

Run: `cat > server/src/middleware/upload.ts << 'EOF'`
```typescript
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
EOF
```

**Step 3: Install uuid**

```bash
cd server && npm install uuid && npm install -D @types/uuid
```

**Step 4: Create upload route**

Run: `cat > server/src/routes/convert.ts << 'EOF'`
```typescript
import express from 'express';
import { upload } from '../middleware/upload';
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

export default router;
EOF
```

**Step 5: Register routes in index.ts**

Edit `server/src/index.ts` - add before httpServer.listen:
```typescript
import convertRoutes from './routes/convert';
app.use('/api', convertRoutes);
```

**Step 6: Test upload endpoint**

```bash
cd server && npm run dev
```

In another terminal:
```bash
curl -X POST -F "files=@web/src/assets/react.svg" http://localhost:3001/api/upload
```

Expected: JSON with file data

**Step 7: Commit**

```bash
git add server/
git commit -m "feat: add file upload endpoint with Multer"
```

---

### Task 3: Implement Conversion Service (Sharp)

**Files:**
- Create: `server/src/services/converter.ts`
- Create: `server/src/routes/convert.ts` (extend)
- Modify: `server/src/index.ts`

**Step 1: Create converter service**

Run: `cat > server/src/services/converter.ts << 'EOF'`
```typescript
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  targetFormat: string;
  quality?: number;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

const SHARP_FORMATS = ['jpeg', 'png', 'webp', 'gif', 'tiff', 'avif'];

export async function convertImage(options: ConversionOptions): Promise<ConversionResult> {
  const { inputPath, outputPath, targetFormat, quality = 85 } = options;

  try {
    // Try Sharp first for common formats
    if (SHARP_FORMATS.includes(targetFormat.toLowerCase())) {
      await convertWithSharp(inputPath, outputPath, targetFormat, quality);
    } else {
      // Fallback to ImageMagick
      await convertWithImageMagick(inputPath, outputPath, targetFormat, quality);
    }

    return { success: true, outputPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function convertWithSharp(
  inputPath: string,
  outputPath: string,
  format: string,
  quality: number
): Promise<void> {
  const pipeline = sharp(inputPath);

  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      await pipeline.jpeg({ quality }).toFile(outputPath);
      break;
    case 'png':
      await pipeline.png().toFile(outputPath);
      break;
    case 'webp':
      await pipeline.webp({ quality }).toFile(outputPath);
      break;
    case 'gif':
      await pipeline.gif().toFile(outputPath);
      break;
    case 'tiff':
      await pipeline.tiff().toFile(outputPath);
      break;
    case 'avif':
      await pipeline.avif({ quality }).toFile(outputPath);
      break;
    default:
      throw new Error(`Unsupported Sharp format: ${format}`);
  }
}

async function convertWithImageMagick(
  inputPath: string,
  outputPath: string,
  format: string,
  quality: number
): Promise<void> {
  const command = `magick "${inputPath}" -quality ${quality} "${outputPath}"`;
  await execAsync(command);
}
EOF
```

**Step 2: Add convert endpoint to convert.ts**

Edit `server/src/routes/convert.ts` - add at end:
```typescript
import { convertImage } from '../services/converter';
import path from 'path';
import fs from 'fs/promises';

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
```

**Step 3: Test conversion**

```bash
cd server && npm run dev
```

Test with curl (in separate terminal):
```bash
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{"files":[{"id":"test","originalName":"test.png","path":"tmp/uploads/test.png"}],"targetFormat":"jpeg","quality":85}'
```

**Step 4: Commit**

```bash
git add server/
git commit -m "feat: implement image conversion with Sharp"
```

---

### Task 4: Add Download Endpoints

**Files:**
- Modify: `server/src/routes/convert.ts`
- Create: `server/src/services/zipper.ts`

**Step 1: Create zipper service**

Run: `cat > server/src/services/zipper.ts << 'EOF'`
```typescript
import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamAsync = promisify(pipeline);

export async function createZip(filePaths: string[], outputPath: string): Promise<void> {
  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  for (let i = 0; i < filePaths.length; i++) {
    const fileName = path.basename(filePaths[i]);
    archive.file(filePaths[i], { name: `${i + 1}-${fileName}` });
  }

  await archive.finalize();
}
EOF
```

**Step 2: Add download endpoints to convert.ts**

Add to `server/src/routes/convert.ts`:
```typescript
import express from 'express';
import { createReadStream } from 'fs';
import { createZip } from '../services/zipper';

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
```

**Step 3: Commit**

```bash
git add server/
git commit -m "feat: add download endpoints with ZIP support"
```

---

## Phase 2: Frontend Foundation

### Task 5: Setup Frontend Dependencies

**Files:**
- Modify: `web/package.json`
- Create: `web/tailwind.config.js` (if not exists)

**Step 1: Install frontend dependencies**

```bash
cd web
npm install axios socket.io-client lucide-react clsx tailwind-merge
npm install -D @types/node
```

**Step 2: Verify Tailwind setup**

Check if `tailwind.config.js` exists:
```bash
ls web/tailwind.config.js
```

If not found, create:
```bash
cd web
npx tailwindcss init -p
```

**Step 3: Update tailwind.config.js**

Edit `web/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Update index.css**

Edit `web/src/index.css` - ensure Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Commit**

```bash
git add web/
git commit -m "feat: install frontend dependencies"
```

---

### Task 6: Create Type Definitions

**Files:**
- Create: `web/src/types/conversion.ts`

**Step 1: Create types file**

Run: `cat > web/src/types/conversion.ts << 'EOF'`
```typescript
export interface FileWithMetadata {
  id: string;
  file: File;
  preview: string;
  originalName: string;
  size: number;
}

export interface ConversionStatus {
  fileId: string;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'error';
  error?: string;
  outputPath?: string;
}

export interface ConvertedFile {
  id: string;
  outputPath: string;
  downloadUrl: string;
}

export interface FormatOption {
  value: string;
  label: string;
  supportsQuality: boolean;
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/types/
git commit -m "feat: add type definitions"
```

---

### Task 7: Create WebSocket Hook

**Files:**
- Create: `web/src/hooks/useWebSocket.ts`

**Step 1: Create WebSocket hook**

Run: `cat > web/src/hooks/useWebSocket.ts << 'EOF'`
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(conversionId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!conversionId) return;

    const socketInstance = io('http://localhost:3001');

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [conversionId]);

  const onProgress = (callback: (data: any) => void) => {
    if (!socket) return;

    socket.on(`progress:${conversionId}`, callback);

    return () => {
      socket.off(`progress:${conversionId}`, callback);
    };
  };

  return { socket, isConnected, onProgress };
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/hooks/
git commit -m "feat: add WebSocket hook"
```

---

### Task 8: Create Conversion Hook

**Files:**
- Create: `web/src/hooks/useConversion.ts`

**Step 1: Create conversion hook**

Run: `cat > web/src/hooks/useConversion.ts << 'EOF'`
```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export function useConversion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.files;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startConversion = useCallback(async (
    files: any[],
    targetFormat: string,
    quality: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/convert`, {
        files,
        targetFormat,
        quality
      });
      setConversionId(response.data.conversionId);
      return response.data.conversionId;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Conversion failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadFile = useCallback((fileId: string, format: string) => {
    window.open(`${API_URL}/download/${fileId}?format=${format}`, '_blank');
  }, []);

  const downloadAll = useCallback(async (files: any[]) => {
    try {
      const response = await axios.post(`${API_URL}/download-all`, { files }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'images.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Download failed');
    }
  }, []);

  return {
    uploadFiles,
    startConversion,
    downloadFile,
    downloadAll,
    isLoading,
    error,
    conversionId
  };
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/hooks/
git commit -m "feat: add conversion hook"
```

---

## Phase 3: UI Components

### Task 9: Create FormatSelector Component

**Files:**
- Create: `web/src/components/FormatSelector.tsx`

**Step 1: Create FormatSelector component**

Run: `cat > web/src/components/FormatSelector.tsx << 'EOF'`
```typescript
import { FormatOption } from '../types/conversion';

const FORMATS: FormatOption[] = [
  { value: 'png', label: 'PNG', supportsQuality: false },
  { value: 'jpeg', label: 'JPEG', supportsQuality: true },
  { value: 'jpg', label: 'JPG', supportsQuality: true },
  { value: 'webp', label: 'WebP', supportsQuality: true },
  { value: 'gif', label: 'GIF', supportsQuality: false },
  { value: 'bmp', label: 'BMP', supportsQuality: false },
  { value: 'tiff', label: 'TIFF', supportsQuality: false },
  { value: 'ico', label: 'ICO', supportsQuality: false },
  { value: 'avif', label: 'AVIF', supportsQuality: true },
];

interface FormatSelectorProps {
  format: string;
  onFormatChange: (format: string) => void;
  quality: number;
  onQualityChange: (quality: number) => void;
}

export function FormatSelector({
  format,
  onFormatChange,
  quality,
  onQualityChange
}: FormatSelectorProps) {
  const selectedFormat = FORMATS.find(f => f.value === format);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format de sortie
        </label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {selectedFormat?.supportsQuality && (
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualité: {quality}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => onQualityChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/FormatSelector.tsx
git commit -m "feat: add FormatSelector component"
```

---

### Task 10: Create DropZone Component

**Files:**
- Create: `web/src/components/DropZone.tsx`

**Step 1: Create DropZone component**

Run: `cat > web/src/components/DropZone.tsx << 'EOF'`
```typescript
import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      onFilesSelected(imageFiles);
    }
  }, [onFilesSelected]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center transition-colors
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 hover:border-gray-400'
        }
      `}
    >
      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">
        Glissez vos images ici
      </p>
      <p className="text-sm text-gray-500 mb-4">
        ou cliquez pour parcourir
      </p>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="file-input"
      />
      <label
        htmlFor="file-input"
        className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors"
      >
        Parcourir
      </label>
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/DropZone.tsx
git commit -m "feat: add DropZone component"
```

---

### Task 11: Create FileList Component

**Files:**
- Create: `web/src/components/FileList.tsx`

**Step 1: Create FileList component**

Run: `cat > web/src/components/FileList.tsx << 'EOF'`
```typescript
import { FileWithMetadata } from '../types/conversion';
import { X } from 'lucide-react';

interface FileListProps {
  files: FileWithMetadata[];
  onRemoveFile: (id: string) => void;
}

export function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Fichiers sélectionnés ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <img
              src={file.preview}
              alt={file.originalName}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.originalName}
              </p>
              <p className="text-sm text-gray-500">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemoveFile(file.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/FileList.tsx
git commit -m "feat: add FileList component"
```

---

### Task 12: Create ProgressBar Component

**Files:**
- Create: `web/src/components/ProgressBar.tsx`

**Step 1: Create ProgressBar component**

Run: `cat > web/src/components/ProgressBar.tsx << 'EOF'`
```typescript
import { ConversionStatus } from '../types/conversion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface ProgressBarProps {
  conversions: Map<string, ConversionStatus>;
  globalProgress: { completed: number; total: number };
}

export function ProgressBar({ conversions, globalProgress }: ProgressBarProps) {
  if (conversions.size === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'converting': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'converting': return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return null;
    }
  };

  const globalPercentage = globalProgress.total > 0
    ? (globalProgress.completed / globalProgress.total) * 100
    : 0;

  return (
    <div className="mt-6 space-y-4">
      {/* Global Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progression globale</span>
          <span>
            {globalProgress.completed}/{globalProgress.total} (
            {Math.round(globalPercentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${globalPercentage}%` }}
          />
        </div>
      </div>

      {/* Individual Progress */}
      <div className="space-y-2">
        {Array.from(conversions.values()).map((conv) => (
          <div key={conv.fileId} className="flex items-center gap-3">
            {getStatusIcon(conv.status)}
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusColor(conv.status)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${conv.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-600 w-12 text-right">
              {Math.round(conv.progress)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/ProgressBar.tsx
git commit -m "feat: add ProgressBar component"
```

---

### Task 13: Create DownloadButtons Component

**Files:**
- Create: `web/src/components/DownloadButtons.tsx`

**Step 1: Create DownloadButtons component**

Run: `cat > web/src/components/DownloadButtons.tsx << 'EOF'`
```typescript
import { Download } from 'lucide-react';
import { ConversionStatus } from '../types/conversion';

interface DownloadButtonsProps {
  conversions: Map<string, ConversionStatus>;
  targetFormat: string;
  onDownloadFile: (fileId: string) => void;
  onDownloadAll: () => void;
}

export function DownloadButtons({
  conversions,
  targetFormat,
  onDownloadFile,
  onDownloadAll
}: DownloadButtonsProps) {
  const completedConversions = Array.from(conversions.values()).filter(
    c => c.status === 'completed'
  );

  if (completedConversions.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {completedConversions.length > 1 && (
        <button
          onClick={onDownloadAll}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Télécharger tout (ZIP)
        </button>
      )}

      <div className="space-y-2">
        {completedConversions.map((conv) => (
          <button
            key={conv.fileId}
            onClick={() => onDownloadFile(conv.fileId)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">
              {conv.fileId.slice(0, 8)}.{targetFormat}
            </span>
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/DownloadButtons.tsx
git commit -m "feat: add DownloadButtons component"
```

---

### Task 14: Create Main ImageConverter Component

**Files:**
- Create: `web/src/components/ImageConverter.tsx`

**Step 1: Create ImageConverter component**

Run: `cat > web/src/components/ImageConverter.tsx << 'EOF'`
```typescript
import { useState, useEffect } from 'react';
import { FileWithMetadata, ConversionStatus } from '../types/conversion';
import { useConversion } from '../hooks/useConversion';
import { useWebSocket } from '../hooks/useWebSocket';
import { FormatSelector } from './FormatSelector';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { ProgressBar } from './ProgressBar';
import { DownloadButtons } from './DownloadButtons';

export function ImageConverter() {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [conversions, setConversions] = useState<Map<string, ConversionStatus>>(new Map());
  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(85);

  const { uploadFiles, startConversion, downloadFile, downloadAll, isLoading, conversionId } =
    useConversion();

  const { onProgress } = useWebSocket(conversionId);

  useEffect(() => {
    if (!onProgress) return;

    const unsubscribe = onProgress((data) => {
      setConversions(prev => {
        const newMap = new Map(prev);
        newMap.set(data.fileId, {
          fileId: data.fileId,
          progress: data.progress,
          status: data.status,
          error: data.error,
          outputPath: data.outputPath
        });
        return newMap;
      });
    });

    return unsubscribe;
  }, [onProgress]);

  const handleFilesSelected = async (newFiles: File[]) => {
    const filesWithMetadata: FileWithMetadata[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      originalName: file.name,
      size: file.size
    }));

    setFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    const uploadedFiles = await uploadFiles(files.map(f => f.file));
    if (!uploadedFiles) return;

    const id = await startConversion(uploadedFiles, targetFormat, quality);
    if (!id) return;

    setConversions(new Map());
  };

  const globalProgress = {
    completed: Array.from(conversions.values()).filter(c => c.status === 'completed').length,
    total: files.length
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Convertisseur d'Images
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Convertissez vos images en tous formats, rapidement et facilement
        </p>

        <FormatSelector
          format={targetFormat}
          onFormatChange={setTargetFormat}
          quality={quality}
          onQualityChange={setQuality}
        />

        <div className="mt-6">
          <DropZone onFilesSelected={handleFilesSelected} />
        </div>

        <FileList files={files} onRemoveFile={handleRemoveFile} />

        {files.length > 0 && conversions.size === 0 && (
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Conversion en cours...' : `Convertir en ${targetFormat.toUpperCase()}`}
          </button>
        )}

        <ProgressBar conversions={conversions} globalProgress={globalProgress} />

        <DownloadButtons
          conversions={conversions}
          targetFormat={targetFormat}
          onDownloadFile={downloadFile}
          onDownloadAll={() => downloadAll(Array.from(conversions.values()))}
        />
      </div>
    </div>
  );
}
EOF
```

**Step 2: Commit**

```bash
git add web/src/components/ImageConverter.tsx
git commit -m "feat: add ImageConverter main component"
```

---

### Task 15: Update App.tsx

**Files:**
- Modify: `web/src/App.tsx`

**Step 1: Replace App.tsx content**

Run: `cat > web/src/App.tsx << 'EOF'`
```typescript
import { ImageConverter } from './components/ImageConverter';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <ImageConverter />
    </div>
  );
}

export default App;
EOF
```

**Step 2: Remove unused CSS**

```bash
rm web/src/App.css
```

Edit `web/src/main.tsx` - remove App.css import if present.

**Step 3: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat: update App.tsx with ImageConverter"
```

---

## Phase 4: Testing & Finalization

### Task 16: Test Full Application

**Step 1: Start backend**

```bash
cd server
npm run dev
```

Expected: "Server running on port 3001"

**Step 2: Start frontend**

In new terminal:
```bash
cd web
npm run dev
```

Expected: Frontend running on port 5173 (or similar)

**Step 3: Test complete flow**

1. Open browser to frontend URL
2. Drag & drop multiple images
3. Select format (JPEG) and quality
4. Click Convert
5. Verify progress bars update in real-time
6. Download individual files
7. Download all as ZIP

**Step 4: Check for errors**

Open browser DevTools Console:
- Should see no errors
- WebSocket connection should be visible

**Step 5: Test edge cases**

- Try uploading non-image file (should be rejected)
- Try converting with same format (should work)
- Try single file conversion
- Try large file (~10MB)

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address testing issues"
```

---

### Task 17: Add Error Boundaries and Loading States

**Files:**
- Modify: `web/src/components/ImageConverter.tsx`

**Step 1: Add error display**

Edit ImageConverter.tsx - add before return:
```typescript
const { error } = useConversion();

if (error) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add web/src/components/ImageConverter.tsx
git commit -m "feat: add error boundary display"
```

---

### Task 18: Cleanup Old Files

**Step 1: Remove unused assets**

```bash
rm -rf web/src/assets/react.svg web/src/assets/vite.svg
```

**Step 2: Update README**

Create `README.md`:
```markdown
# Image Converter

Full-stack image converter application with real-time progress tracking.

## Features

- Convert images to any format (PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, AVIF, and more)
- Batch conversion with drag & drop
- Real-time progress tracking via WebSocket
- Quality adjustment for JPEG/WebP
- Individual or ZIP download
- Automatic file cleanup

## Tech Stack

### Backend
- Express + TypeScript
- Sharp (fast formats)
- ImageMagick (exotic formats)
- Socket.io (real-time progress)
- Multer (file uploads)

### Frontend
- React + TypeScript + Vite
- TailwindCSS
- Lucide Icons
- Socket.io-client
- Axios

## Getting Started

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd web
npm install
npm run dev
```

## Usage

1. Drag & drop images or click to browse
2. Select output format and quality
3. Click Convert
4. Download individually or all as ZIP
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

### Task 19: Final Polish

**Step 1: Add responsive design improvements**

Edit `web/src/components/ImageConverter.tsx` - update main div:
```typescript
<div className="max-w-4xl mx-auto p-4 sm:p-6">
```

**Step 2: Add loading spinners**

Edit `web/src/components/DropZone.tsx` - add to button when uploading:
```typescript
{isLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}
```

**Step 3: Test on mobile**

- Resize browser to mobile width
- Verify layout is responsive
- Test touch interactions

**Step 4: Final commit**

```bash
git add -A
git commit -m "polish: final UI improvements and responsive design"
```

---

## Summary

This implementation plan creates a full-stack image converter with:

✅ Backend: Express API with Sharp + ImageMagick
✅ Real-time progress via WebSocket
✅ Frontend: React with TailwindCSS
✅ Drag & drop upload
✅ Batch conversion
✅ Quality adjustment
✅ Individual/ZIP downloads
✅ Automatic cleanup
✅ Responsive design
✅ Error handling

**Total estimated time:** 3-4 hours following TDD approach with frequent commits.
