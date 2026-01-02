
import { jsPDF } from 'jspdf';
import { MangaImage } from '../types';

/**
 * Generates a PDF where each page matches the exact dimensions of the source image.
 * This prevents the "shrinking" effect and preserves original manga quality.
 */
export const generatePDF = async (
  images: MangaImage[],
  chapterName: string,
  onProgress: (p: number) => void
): Promise<Blob> => {
  // 1. Natural Sort: ensures '10.jpg' comes after '2.jpg'
  const sortedImages = [...images].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  let pdf: jsPDF | null = null;

  for (let i = 0; i < sortedImages.length; i++) {
    const imgData = await fileToDataURL(sortedImages[i].file);
    
    // Load image to get true pixel dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgData;
    });

    const width = img.width;
    const height = img.height;

    // Initialize PDF on the first image with correct dimensions
    if (i === 0) {
      pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
        compress: true,
      });
    } else if (pdf) {
      // Add new page matching this specific image's dimensions
      pdf.addPage([width, height], width > height ? 'landscape' : 'portrait');
    }

    if (pdf) {
      // Add image filling the entire page exactly (0,0 to width,height)
      pdf.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
    }

    onProgress(Math.round(((i + 1) / sortedImages.length) * 100));
  }

  if (!pdf) throw new Error("No images found to generate PDF");
  
  return pdf.output('blob');
};

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
