import React, { useState, useCallback, useRef } from 'react';
import { 
  FolderPlus, 
  Download, 
  Loader2,
  CheckCircle2,
  Layers,
  Trash2
} from 'lucide-react';
import { Chapter, MangaImage } from './types';
import { generatePDF } from './services/pdfService';
import { MangaCard } from './components/MangaCard';
import { Lightbox } from './components/Lightbox';

// Component to handle the brand logo loading from logos folder with hover effect
const BrandLogo = () => {
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
        <Layers className="text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="relative group w-10 h-10 cursor-pointer">
      <img 
        src="logos/logo-open.png" 
        alt="Deksmo Logo" 
        className="absolute inset-0 h-full w-full object-contain transition-all duration-300 opacity-100 group-hover:opacity-0 scale-100 group-hover:scale-90" 
        onError={() => setError(true)}
      />
      <img 
        src="logos/logo-wink.png" 
        alt="Deksmo Logo Wink" 
        className="absolute inset-0 h-full w-full object-contain transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100" 
        onError={() => setError(true)}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // State for the image viewer
  const [lightboxData, setLightboxData] = useState<{ images: MangaImage[], initialIndex: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleChapter = (id: string) => {
    const next = new Set(expandedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedChapters(next);
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = (Array.from(files) as File[]).filter(f => 
      f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp)$/i)
    );
    
    const folderMap: Record<string, MangaImage[]> = {};
    
    newFiles.forEach((file) => {
      // @ts-ignore
      const path = file.webkitRelativePath || '';
      const parts = path.split('/');
      const folderName = parts.length > 1 ? parts[parts.length - 2] : 'Loose Images';
      
      const mangaImg: MangaImage = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
      };

      if (!folderMap[folderName]) folderMap[folderName] = [];
      folderMap[folderName].push(mangaImg);
    });

    // Sort images within each folder numerically (1.jpg, 2.jpg, 10.jpg)
    Object.keys(folderMap).forEach(key => {
      folderMap[key].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    });

    const newChapters: Chapter[] = Object.entries(folderMap).map(([name, images]) => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      images,
      isProcessing: false,
    }));

    setChapters(prev => {
      // Combine and sort chapters numerically by folder name (Chapter 1, Chapter 2, Chapter 10)
      const combined = [...prev, ...newChapters];
      return combined.sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id));
  };
  
  const removeImage = (chapterId: string, imageId: string) => {
    setChapters(prev => prev.map(c => {
      if (c.id === chapterId) {
        return { ...c, images: c.images.filter(img => img.id !== imageId) };
      }
      return c;
    }));
  };

  const exportPDF = async (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    setIsProcessing(true);
    setStatusMessage(`Building PDF: ${chapter.name}`);
    try {
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, isProcessing: true } : c));
      const blob = await generatePDF(chapter.images, chapter.name, (p) => setGlobalProgress(p));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chapter.name}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Error generating PDF for ' + chapter.name);
    } finally {
      setIsProcessing(false);
      setGlobalProgress(0);
      setStatusMessage('');
      setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, isProcessing: false } : c));
    }
  };

  const convertAll = async () => {
    if (chapters.length === 0) return;
    setIsProcessing(true);
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      setStatusMessage(`Processing Chapter ${i + 1}/${chapters.length}: ${chapter.name}`);
      try {
        setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, isProcessing: true } : c));
        const blob = await generatePDF(chapter.images, chapter.name, (p) => setGlobalProgress(p));
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chapter.name}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 500));
        setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, isProcessing: false } : c));
      } catch (err) {
        console.error(err);
      }
    }
    setIsProcessing(false);
    setStatusMessage('Batch complete!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="bg-[#0f172a]/80 backdrop-blur-md border-b border-[#1e2c43] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
                Deksmo
              </h1>
              <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">Local Edition</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {chapters.length > 0 && (
              <button
                onClick={convertAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95"
              >
                <Download size={18} />
                <span>Export All</span>
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95"
            >
              <FolderPlus size={18} />
              <span className="hidden sm:inline">Add Folders</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              // @ts-ignore
              webkitdirectory="" 
              directory="" 
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-32 h-32 bg-[#1e2c43] rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 rotate-3 border border-indigo-500/20 relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <FolderPlus className="text-indigo-400 w-12 h-12 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h2 className="text-4xl font-black mb-4 text-white tracking-tight">Drop your Manga here</h2>
            <p className="text-slate-400 max-w-sm px-6 mb-12 leading-relaxed text-lg">
              Select your parent folder. Deksmo will sort everything numerically and prep them for PDF export.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-12 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-indigo-50 hover:-translate-y-1 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
            >
              Import Folders
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{chapters.length} Chapters Queued</h2>
              </div>
              <button 
                onClick={() => setChapters([])}
                className="text-xs text-slate-500 hover:text-red-400 font-semibold uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear All
              </button>
            </div>

            <div className="grid gap-6">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="flex flex-col">
                  <MangaCard 
                    chapter={chapter}
                    isExpanded={expandedChapters.has(chapter.id)}
                    onExpand={() => toggleChapter(chapter.id)}
                    onExport={() => exportPDF(chapter.id)}
                    onDelete={() => removeChapter(chapter.id)}
                  />
                  
                  {/* Expanded Grid View */}
                  <div className={`
                    overflow-hidden transition-all duration-500 ease-in-out
                    ${expandedChapters.has(chapter.id) ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                  `}>
                    <div className="bg-[#182335] rounded-xl border border-[#1e2c43] p-6 shadow-inner shadow-black/20">
                      <div className="flex items-center justify-between mb-4">
                         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Page Inspection</h4>
                         <span className="text-xs text-slate-600">Showing all pages in numeric order</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {chapter.images.map((img, idx) => (
                          <div key={img.id} className="group relative aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-colors cursor-zoom-in">
                            <img 
                              src={img.previewUrl} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                              loading="lazy" 
                              onClick={() => setLightboxData({ images: chapter.images, initialIndex: idx })}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] py-0.5 text-center font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {img.name}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeImage(chapter.id, img.id); }}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Overlay */}
      {lightboxData && (
        <Lightbox 
          images={lightboxData.images}
          initialIndex={lightboxData.initialIndex}
          onClose={() => setLightboxData(null)}
        />
      )}

      {/* Global Status Notification */}
      {statusMessage && !isProcessing && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-[60]">
          <CheckCircle2 className="text-white" />
          <span className="font-bold tracking-wide">{statusMessage}</span>
        </div>
      )}

      {/* Progress Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -z-10 animate-pulse" />
            
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 border-[6px] border-[#1e2c43] rounded-full"></div>
              <div 
                className="absolute inset-0 border-[6px] border-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                style={{ 
                  clipPath: `conic-gradient(transparent 0% ${100 - globalProgress}%, black ${100 - globalProgress}% 100%)`,
                  transform: 'rotate(90deg) scaleX(-1)'
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-white">{globalProgress}%</span>
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Processing</h3>
            <p className="text-slate-400 font-medium mb-10 px-4 text-lg">{statusMessage}</p>
            
            <div className="flex items-center justify-center gap-3 bg-[#1e2c43]/50 py-3 rounded-full mx-auto w-fit px-6 border border-white/5">
              <Loader2 className="animate-spin text-indigo-400" size={20} />
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Archiving Assets</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;