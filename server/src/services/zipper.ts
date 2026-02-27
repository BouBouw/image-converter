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
