
export interface MangaImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export interface Chapter {
  id: string;
  name: string;
  images: MangaImage[];
  isProcessing: boolean;
}

export interface ProcessingState {
  status: 'idle' | 'analyzing' | 'generating' | 'completed' | 'error';
  message: string;
  progress: number;
}