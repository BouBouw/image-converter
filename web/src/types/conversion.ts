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
