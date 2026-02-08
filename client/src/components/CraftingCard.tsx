import React, { useState, useEffect } from 'react';

interface CraftingCardProps {
  type: 'abidos' | 'superior';
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  batchDuration: number | null;
  concurrency: number;
  totalSlots: number;
}

export default function CraftingCard({ 
  type, 
  isActive, 
  startTime, 
  endTime, 
  batchDuration,
  concurrency,
  totalSlots
}: CraftingCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [producedItems, setProducedItems] = useState<number>(0);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [currentBatchIcons, setCurrentBatchIcons] = useState<number>(0);

  const totalTargetItems = totalSlots * 10;
  const itemsPerBatch = concurrency * 10;
  const itemName = type === 'abidos' ? '아비도스 융화 재료' : '상급 아비도스 융화 재료';

  useEffect(() => {
    if (!isActive || !startTime || !endTime || !batchDuration) {
       setTimeLeft('');
       setProducedItems(0);
       setBatchProgress(0);
       setCurrentBatchIcons(0);
       return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setProducedItems(totalTargetItems);
        setBatchProgress(100);
        setCurrentBatchIcons(10);
        return;
      }

      // Time Display
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      // Batch Logic
      const elapsed = now - startTime;
      const completedBatches = Math.floor(elapsed / batchDuration);
      const currentBatchElapsed = elapsed % batchDuration;
      
      // Calculate Produced Items
      const currentProduced = Math.min(totalTargetItems, completedBatches * itemsPerBatch);
      setProducedItems(currentProduced);

      // Batch Progress (0-100%)
      // If we are done with all batches, progress is 100
      if (currentProduced >= totalTargetItems) {
          setBatchProgress(100);
          setCurrentBatchIcons(10);
      } else {
          const progress = (currentBatchElapsed / batchDuration);
          setBatchProgress(progress * 100);
          setCurrentBatchIcons(Math.floor(progress * 10)); // 0 to 9 icons filled
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // Faster update for smooth batch progress
    return () => clearInterval(interval);
  }, [isActive, startTime, endTime, batchDuration, totalTargetItems, itemsPerBatch]);

  return (
    <div 
      className={`w-full relative overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'bg-slate-900/90 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-900/50 border-white/5 opacity-80 hover:opacity-100'}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      {/* Top Glow (Active) */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
      )}
      
      <div className="p-5 flex items-center justify-between gap-6 relative z-10">
          
          {/* Left: Status Info */}
          <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isActive ? 'Crafting in Progress' : 'Ready to Craft'}
                </h3>
              </div>
              
              <div className="flex items-baseline gap-3">
                  <span className={`text-2xl font-black font-mono tracking-tight ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-500'}`}>
                      {isActive ? producedItems.toLocaleString() : '-'}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                      / {isActive ? totalTargetItems.toLocaleString() : '-'} items
                  </span>
              </div>
              
              {isActive && (
                 <div className="text-xs text-blue-300/80 mt-1 font-mono">
                    {timeLeft} remaining
                 </div>
              )}
          </div>

          {/* Right: Batch Visualizer (10 Icons) */}
          <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1 p-1.5 bg-black/40 rounded-lg border border-white/5 shadow-inner">
                  {Array.from({ length: 10 }).map((_, i) => {
                      const isFilled = i < currentBatchIcons;
                      const isNext = i === currentBatchIcons;
                      
                      return (
                        <div 
                            key={i} 
                            className={`w-5 h-8 rounded-sm relative overflow-hidden transition-all duration-300 ${
                                isFilled 
                                ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] scale-100 opacity-100' 
                                : isActive && isNext 
                                    ? 'bg-white/5 scale-95 opacity-50' 
                                    : 'bg-white/5 scale-90 opacity-20'
                            }`}
                        >
                            {isFilled && <div className="absolute inset-0 bg-white/20 rotate-45 translate-x-[-100%] animate-[shine_2s_infinite]" />}
                        </div>
                      );
                  })}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Batch Progress
              </div>
          </div>
      </div>

      {/* Progress Bar (Bottom) */}
      {isActive && (
          <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
              <div 
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300 ease-linear"
                style={{ width: `${batchProgress}%` }}
              />
          </div>
      )}
    </div>
  );
}
