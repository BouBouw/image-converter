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
