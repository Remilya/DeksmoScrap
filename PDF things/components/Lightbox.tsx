
import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { MangaImage } from '../types';

interface LightboxProps {
  images: MangaImage[];
  initialIndex: number;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3 text-white/80">
          <ImageIcon size={18} />
          <span className="font-mono text-sm">{currentImage.name}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold ml-2">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Image Area */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
        <img 
          src={currentImage.previewUrl} 
          alt={currentImage.name}
          className="max-w-full max-h-full object-contain shadow-2xl shadow-black"
          style={{ 
             // Subtle animation when switching images
             animation: 'scaleIn 0.2s ease-out' 
          }}
          key={currentIndex} // Force re-render for animation
        />
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black disabled:opacity-0 transition-all transform hover:scale-110 backdrop-blur-md"
        >
          <ChevronLeft size={32} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity">
        <button 
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          className="p-3 rounded-full bg-black/50 text-white hover:bg-white hover:text-black disabled:opacity-0 transition-all transform hover:scale-110 backdrop-blur-md"
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.98); opacity: 0.8; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
