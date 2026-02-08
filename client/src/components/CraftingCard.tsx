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

  const totalTargetItems = totalSlots * 10;
  const itemsPerBatch = concurrency * 10;
  const itemName = type === 'abidos' ? '아비도스 융화 재료' : '상급 아비도스 융화 재료';

  useEffect(() => {
    if (!startTime || !endTime || !batchDuration) {
       setTimeLeft('');
       setProducedItems(0);
       setBatchProgress(0);
       return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setProducedItems(totalTargetItems);
        setBatchProgress(100);
        return;
      }
      
      // If not active and not complete, we shouldn't be here (cancelled?)
      if (!isActive) return;

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

      // Batch Progress (0-100% relative to 10 batches)
      if (currentProduced >= totalTargetItems) {
          setBatchProgress(100);
      } else {
          const currentBatchIndex = completedBatches % 10;
          const currentBatchPercent = (currentBatchElapsed / batchDuration) * 100;
          setBatchProgress((currentBatchIndex * 10) + (currentBatchPercent / 10));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // Faster update for smooth batch progress
    return () => clearInterval(interval);
  }, [isActive, startTime, endTime, batchDuration, totalTargetItems, itemsPerBatch]);

  const isComplete = !isActive && endTime !== null && Date.now() >= endTime;

  return (
    <div 
      className={`w-full relative overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'bg-slate-900/90 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : isComplete ? 'bg-slate-900/80 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-slate-900/50 border-white/5 opacity-80 hover:opacity-100'}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      {/* Top Glow (Active or Complete) */}
      {(isActive || isComplete) && (
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isComplete ? 'via-green-400' : 'via-blue-400'} to-transparent opacity-50`} />
      )}
      
      <div className="p-5 flex flex-col gap-4 relative z-10">
          
          {/* Header Info */}
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : isComplete ? 'bg-green-500' : 'bg-slate-600'}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
                  {isActive ? 'Crafting...' : isComplete ? 'Completed' : 'Idle'}
                </h3>
              </div>
              {isActive && (
                 <div className="text-xs text-blue-300/80 font-mono">
                    {timeLeft}
                 </div>
              )}
          </div>

          <div className="flex items-baseline justify-between">
              <span className={`text-3xl font-black font-mono tracking-tight ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-slate-500'}`}>
                  {isActive ? producedItems.toLocaleString() : '-'}
              </span>
              <span className="text-xs text-slate-500 font-bold mb-1">
                  / {isActive ? totalTargetItems.toLocaleString() : '-'} items
              </span>
          </div>

          {/* Slots Visualization */}
          <div className="flex flex-col gap-3 flex-1 min-h-[180px]">
            {Array.from({ length: concurrency }).map((_, i) => (
                <div 
                    key={i} 
                    className={`flex-1 w-full rounded-lg border relative overflow-hidden transition-all duration-500 ${
                        isActive || isComplete
                        ? `bg-slate-800/50 ${isComplete ? 'border-green-500/30 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' : 'border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'}` 
                        : 'bg-white/5 border-white/5 opacity-30'
                    }`}
                >
                    {/* 10-Unit Segments with Progress */}
                    <div className="absolute inset-0 flex z-10">
                        {Array.from({ length: 10 }).map((_, idx) => {
                            const completedBlocks = Math.floor(batchProgress / 10);
                            // Calculate percentage for current block (0-100%)
                            const currentBlockPercent = (batchProgress % 10) * 10;
                            
                            const isDone = (isActive && idx < completedBlocks) || isComplete;
                            const isCurrent = isActive && !isComplete && idx === completedBlocks;

                            return (
                                <div key={idx} className="flex-1 relative border-r border-white/10 last:border-0">
                                    {/* Completed Segment (Green) */}
                                    {isDone && (
                                        <div className="absolute inset-0 bg-green-500/40 transition-all duration-300 shadow-[inset_0_0_8px_rgba(34,197,94,0.2)]" />
                                    )}
                                    
                                    {/* Current Active Segment (Blue Filling) */}
                                    {isCurrent && (
                                        <>
                                            <div 
                                                className="absolute top-0 bottom-0 left-0 bg-blue-500/40 transition-all duration-100 ease-linear"
                                                style={{ width: `${currentBlockPercent}%` }}
                                            />
                                            {/* Active Line */}
                                            <div 
                                                className="absolute top-0 bottom-0 w-[2px] bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)] z-20 transition-all duration-100 ease-linear"
                                                style={{ left: `${currentBlockPercent}%` }}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Slot Label Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <span className={`text-xs font-bold tracking-widest ${isComplete ? 'text-green-200/50' : 'text-blue-200/50'}`}>SLOT {i+1}</span>
                    </div>
                </div>
            ))}
          </div>

      </div>

      {/* Progress Bar (Bottom) */}
      {isActive && (
          <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
              <div 
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300 ease-linear"
                style={{ width: `${(producedItems / totalTargetItems) * 100}%` }}
              />
          </div>
      )}
    </div>
  );
}
