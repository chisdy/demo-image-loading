import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Loader2, Plus, Sparkles, Aperture, Clapperboard, Play } from 'lucide-react';

type ImageStatus = 'idle' | 'loading' | 'completed';

interface ImageData {
  id: string;
  status: ImageStatus;
  progress: number;
  aspectRatio: string;
  url?: string;
}

const ASPECT_RATIOS = [
  { label: '16:9', value: '16/9' },
  { label: '9:16', value: '9/16' },
  { label: '1:1', value: '1/1' },
  { label: '4:3', value: '4/3' },
  { label: '3:4', value: '3/4' },
];

export default function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);

  const handleRatioSelect = (ratio: typeof ASPECT_RATIOS[0]) => {
    setSelectedRatio(ratio);
    // Switch back to preview mode when changing ratio
    setActiveImageId(null);
  };

  const handleGenerate = () => {
    const newId = Math.random().toString(36).substring(7);
    const newImage: ImageData = {
      id: newId,
      status: 'loading',
      progress: 0,
      aspectRatio: selectedRatio.value,
    };
    
    setImages(prev => [...prev, newImage]);
    setActiveImageId(newId);

    // Simulate generation progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      // Random increment between 2 and 8
      currentProgress += Math.random() * 6 + 2;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Calculate dimensions for placeholder image based on ratio
        const [w, h] = selectedRatio.value.split('/').map(Number);
        const baseSize = 1200;
        const width = w > h ? baseSize : Math.round(baseSize * (w/h));
        const height = h > w ? baseSize : Math.round(baseSize * (h/w));
        
        setImages(prev => prev.map(img => 
          img.id === newId 
            ? { 
                ...img, 
                status: 'completed', 
                progress: 100, 
                // Using a reliable image placeholder service with a random seed
                url: `https://picsum.photos/seed/${newId}${Date.now()}/${width}/${height}` 
              }
            : img
        ));
      } else {
        setImages(prev => prev.map(img => 
          img.id === newId ? { ...img, progress: currentProgress } : img
        ));
      }
    }, 300); // Update every 300ms for smooth animation
  };

  const activeImage = images.find(img => img.id === activeImageId);
  
  // If no active image, show the idle preview state
  const displayData: ImageData = activeImage || {
    id: 'preview',
    status: 'idle',
    progress: 0,
    aspectRatio: selectedRatio.value,
  };

  return (
    <div className="h-screen w-full bg-[#050505] text-zinc-50 flex flex-col font-sans overflow-hidden selection:bg-white/30">
      {/* Subtle cinematic background grain/glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      {/* Header / Controls */}
      <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Clapperboard className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-100 uppercase text-sm">Lumina Studio</h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">Cinematic Renderer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-zinc-900/80 rounded-md p-1 border border-white/5 shadow-inner">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => handleRatioSelect(ratio)}
                className={`px-4 py-1.5 text-xs tracking-wider rounded font-medium transition-all duration-200 ${
                  selectedRatio.value === ratio.value 
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleGenerate}
            className="group relative flex items-center gap-2 bg-zinc-100 text-black px-6 py-2 rounded-md font-semibold text-sm tracking-wide transition-all hover:bg-white active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            RENDER
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative flex items-center justify-center p-8 z-10">
        <AnimatePresence mode="wait">
          <MainDisplay key={displayData.id === 'preview' ? 'preview' : displayData.id} image={displayData} onGenerate={handleGenerate} />
        </AnimatePresence>
      </main>

      {/* Thumbnails Footer */}
      <footer className="h-44 border-t border-white/5 bg-black/60 backdrop-blur-md p-6 flex items-center gap-4 overflow-x-auto overflow-y-hidden shrink-0 z-20 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {images.map(img => (
            <Thumbnail 
              key={img.id} 
              image={img} 
              isActive={activeImageId === img.id}
              onClick={() => setActiveImageId(img.id)}
            />
          ))}
        </AnimatePresence>
        {images.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs tracking-widest uppercase font-medium">
            Awaiting Sequence
          </div>
        )}
      </footer>
    </div>
  );
}

function MainDisplay({ image, onGenerate }: { image: ImageData, onGenerate: () => void }) {
  const [w, h] = image.aspectRatio.split('/').map(Number);
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="relative flex-shrink-0"
      style={{
        aspectRatio: `${w} / ${h}`,
        width: `calc((100vh - 300px) * ${w / h})`,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Actual content container */}
      <div className="absolute inset-0 bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center backdrop-blur-sm">
        
        {/* IDLE / PREVIEW STATE */}
        {image.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
            {/* Cinematic Safe Area & Rule of Thirds */}
            <div className="absolute inset-8 border border-white/5 rounded-lg pointer-events-none" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-[0.03]">
              <div className="border-b border-r border-white" />
              <div className="border-b border-r border-white" />
              <div className="border-b border-white" />
              <div className="border-b border-r border-white" />
              <div className="border-b border-r border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>

            {/* Center Cross */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-6 h-[1px] bg-white" />
              <div className="absolute h-6 w-[1px] bg-white" />
            </div>

            {/* Corner Tech Specs (Subtle) */}
            <div className="absolute top-6 left-6 flex flex-col gap-1.5 text-[10px] font-mono text-zinc-600 tracking-widest">
              <span>FORMAT: {w}:{h}</span>
              <span>SENSOR: 35MM</span>
            </div>
            <div className="absolute top-6 right-6 flex flex-col gap-1.5 text-[10px] font-mono text-zinc-600 tracking-widest text-right">
              <span>ISO 800</span>
              <span>5600K</span>
            </div>
            <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 text-[10px] font-mono text-zinc-600 tracking-widest">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
                STANDBY
              </span>
            </div>
            <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 text-[10px] font-mono text-zinc-600 tracking-widest text-right">
              <span>24 FPS</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg backdrop-blur-md">
                <Aperture className="w-6 h-6 text-zinc-400" strokeWidth={1.2} />
              </div>
              <h2 className="text-lg font-light tracking-[0.3em] text-zinc-300 uppercase mb-2">Frame Setup</h2>
              <p className="text-[10px] tracking-[0.2em] text-zinc-500 mb-8 uppercase">Awaiting Render Sequence</p>
              
              <button 
                onClick={onGenerate}
                className="group flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white rounded-full text-xs font-medium tracking-widest uppercase transition-all duration-300"
              >
                <Play className="w-3 h-3 transition-transform group-hover:scale-110" fill="currentColor" />
                Initialize
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {image.status === 'completed' && image.url && (
          <motion.img 
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={image.url} 
            alt="Generated artwork" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {/* LOADING / RENDERING STATE (Cinematic Style) */}
        {image.status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
            
            {/* Cinematic Viewfinder Marks */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-[1px] border-l-[1px] border-white/30" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-[1px] border-r-[1px] border-white/30" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-[1px] border-l-[1px] border-white/30" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-[1px] border-r-[1px] border-white/30" />
            
            {/* Center Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-[1px] h-12 bg-white" />
              <div className="absolute h-[1px] w-12 bg-white" />
            </div>

            {/* Center Percentage & Text */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <span className="text-6xl md:text-8xl font-light text-white tracking-widest drop-shadow-lg">
                  {Math.round(image.progress)}<span className="text-2xl md:text-4xl text-white/40 ml-2 font-thin">%</span>
                </span>
              </div>
              
              <div className="mt-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px] font-medium tracking-[0.6em] uppercase text-zinc-400">
                  Rendering Frame
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated Border Progress (Must exist during loading) */}
      {image.status === 'loading' && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Main sharp stroke */}
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="overflow-visible absolute inset-0">
            <rect
              x="0" y="0" width="100%" height="100%"
              fill="none"
              stroke="url(#cinematic-gradient)"
              strokeWidth="2"
              rx="12" // Matches rounded-xl
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - image.progress}
              strokeLinecap="square"
              className="transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="cinematic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#a1a1aa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Outer subtle glow stroke */}
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 overflow-visible blur-[6px] opacity-60">
            <rect
              x="0" y="0" width="100%" height="100%"
              fill="none"
              stroke="url(#cinematic-gradient)"
              strokeWidth="4"
              rx="12"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - image.progress}
              strokeLinecap="square"
              className="transition-all duration-300 ease-out"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function Thumbnail({ image, isActive, onClick }: { image: ImageData, isActive: boolean, onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      onClick={onClick}
      className={`relative h-full shrink-0 rounded-lg overflow-hidden transition-all duration-300 group ${
        isActive 
          ? 'ring-1 ring-white ring-offset-4 ring-offset-[#050505] shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
          : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-white/20'
      }`}
      style={{ aspectRatio: image.aspectRatio }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a] border border-white/10">
        {image.status === 'completed' && image.url ? (
          <>
            <img 
              src={image.url} 
              alt="Thumbnail" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              referrerPolicy="no-referrer" 
            />
            {/* Subtle overlay on inactive thumbnails */}
            {!isActive && <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:opacity-0" />}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
            <div className="animate-pulse">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" strokeWidth={1.5} />
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}
