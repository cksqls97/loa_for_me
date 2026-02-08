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
    if (!isActive || !startTime || !endTime || !batchDuration) {
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
      if (currentProduced >= totalTargetItems) {
          setBatchProgress(100);
      } else {
          setBatchProgress((currentBatchElapsed / batchDuration) * 100);
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
      
      <div className="p-5 flex flex-col gap-4 relative z-10">
          
          {/* Header Info */}
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isActive ? 'Crafting...' : 'Idle'}
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
          <div className="flex flex-col gap-2">
            {Array.from({ length: concurrency }).map((_, i) => (
                <div 
                    key={i} 
                    className={`h-12 w-full rounded-lg border relative overflow-hidden transition-all duration-500 ${
                        isActive 
                        ? 'bg-slate-800/50 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]' 
                        : 'bg-white/5 border-white/5 opacity-30'
                    }`}
                >
                    {isActive && (
                        <>
                            {/* Filling Effect */}
                            <div 
                                className="absolute bottom-0 left-0 right-0 bg-blue-500/20 transition-all duration-100 ease-linear"
                                style={{ height: `${batchProgress}%` }}
                            />
                            {/* Animated Scanner Line */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-blue-400/50 shadow-[0_0_5px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }} />
                            
                            {/* Slot Label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-blue-200/50">SLOT {i+1}</span>
                            </div>
                        </>
                    )}
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
