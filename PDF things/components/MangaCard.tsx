
import React, { useRef, useState } from 'react';
import { BookOpen, Trash2, Download, ChevronDown } from 'lucide-react';
import { Chapter } from '../types';

interface MangaCardProps {
  chapter: Chapter;
  onExpand: () => void;
  onExport: () => void;
  onDelete: () => void;
  isExpanded: boolean;
}

export const MangaCard: React.FC<MangaCardProps> = ({ 
  chapter, 
  onExpand, 
  onExport, 
  onDelete,
  isExpanded 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Sorting images to get the first one numerically for the cover
  const coverImage = chapter.images[0]?.previewUrl;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    const rotateY = xPct * 16; 
    const rotateX = yPct * -16;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        group relative flex h-[240px] w-full overflow-hidden rounded-lg 
        bg-[#182335] border border-[#1e2c43] shadow-lg
        transition-all duration-300
        ${isExpanded ? 'ring-2 ring-indigo-500/50' : ''}
      `}
      style={{
        transform: isHovering 
          ? `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        willChange: 'transform',
        zIndex: isHovering ? 50 : 1
      }}
    >
      {/* Background/Structure Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#182335] via-[#182335] to-transparent z-10 pointer-events-none w-[70%]" />

      {/* Left Side Content */}
      <div className="relative z-20 flex flex-1 flex-col justify-between p-5 pr-12 w-[65%]">
        
        {/* Header: Status & Title */}
        <div>
          <span className={`mb-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${chapter.isProcessing ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#c6cacf]/10 text-[#c6cacf]/60'}`}>
            {chapter.isProcessing ? 'PROCESSING' : 'READY'}
          </span>
          <h3 className="text-xl font-bold leading-tight text-white transition-colors duration-200 group-hover:text-[#3b82f6] line-clamp-2 mt-2">
            {chapter.name}
          </h3>
        </div>

        {/* Description */}
        <div className="mt-2 text-sm text-[#c6cacf]/80 line-clamp-2 leading-relaxed">
          Contains {chapter.images.length} pages. Folder: "{chapter.name}".
          {chapter.isProcessing ? " Currently generating PDF..." : " Ready for export."}
        </div>

        {/* Footer: Chapter & Actions */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-3 text-sm text-white font-medium">
            <BookOpen size={14} className="text-[#3b82f6]" />
            <span>{chapter.images.length} Pages</span>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs relative z-30">
            <button 
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all border border-[#3b82f6]/20"
            >
              <Download size={12} />
              PDF
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side Image Area */}
      <div className="absolute top-0 right-0 h-full w-[55%] z-0 overflow-visible pointer-events-none">
        {/* The skewed image container */}
        <div 
          className="relative h-full w-full transition-transform duration-500 ease-out group-hover:translate-x-[-5px]"
          style={{
            transform: 'skewX(-10deg) translateX(20px)',
            transformOrigin: 'bottom right'
          }}
        >
          {/* Mask/Gradient overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#182335] via-transparent to-transparent opacity-90" />
          
          <img 
            src={coverImage} 
            alt={chapter.name}
            className="h-[120%] w-full object-cover object-center opacity-60 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              transform: 'scale(1.1) translateY(-10px)', 
            }}
          />
        </div>
      </div>
      
      {/* Expand/View Toggle */}
      <button 
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        className={`absolute top-3 right-3 z-30 p-2 rounded-full border transition-all duration-300
          ${isExpanded 
            ? 'bg-white/20 text-white opacity-100' 
            : 'bg-white/10 text-white/70 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
          }
          backdrop-blur-md border-white/10 hover:bg-white/30 cursor-pointer pointer-events-auto`}
      >
        <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Glossy Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
        style={{
          background: `radial-gradient(circle at ${50 - rotation.y * 3}% ${50 - rotation.x * 3}%, rgba(255,255,255,0.1), transparent 50%)`
        }}
      />
    </div>
  );
};