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
  const currentSlots = Math.floor(producedItems / 10);
  const progressPercent = totalSlots > 0 ? Math.floor((currentSlots / totalSlots) * 100) : 0;
  const eta = endTime ? new Date(endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';

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
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : isComplete ? 'bg-green-500' : 'bg-slate-600'}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isComplete ? 'text-green-400' : 'text-slate-400'}`}>
                  {isActive ? 'Crafting In Progress' : isComplete ? 'Crafting Complete' : 'Ready to Craft'}
                </h3>
              </div>
          </div>

          {/* Progress & Stat Row */}
          <div className="flex flex-col gap-4 mb-6">
              {/* Count & Percent */}
              <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                      <span className={`text-4xl font-black tracking-tight ${(isActive || isComplete) ? 'text-white' : 'text-slate-500'}`}>
                          {(isActive || isComplete) ? currentSlots.toLocaleString() : '-'}
                      </span>
                      <span className="text-sm text-slate-500 font-bold">
                          / {(isActive || isComplete) ? totalSlots.toLocaleString() : '-'} Slots
                      </span>
                  </div>
                  {(isActive || isComplete) && (
                      <span className={`text-3xl font-black ${isComplete ? 'text-green-400' : 'text-blue-500'}`}>
                          {progressPercent}%
                      </span>
                  )}
              </div>

              {/* Timer & ETA Grid */}
              {(isActive || isComplete) && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/50 rounded-xl p-4 border border-white/5">
                      <div className="flex flex-col gap-1">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">남은 시간</span>
                          <span className={`text-2xl font-bold tracking-tight ${isComplete ? 'text-green-400' : 'text-white'}`}>
                              {timeLeft || '00:00:00'}
                          </span>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-white/5 pl-4">
                          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">예상 종료</span>
                          <span className="text-2xl font-bold tracking-tight text-slate-300">
                              {eta}
                          </span>
                      </div>
                  </div>
              )}
          </div>

          {/* Slots Visualization */}
          <div className="flex flex-col gap-3 flex-1 min-h-[180px]">
            {Array.from({ length: concurrency }).map((_, i) => {
                const totalCycles = Math.ceil(totalSlots / concurrency);
                const currentElapsed = (isActive && startTime) 
                    ? Date.now() - startTime 
                    : (isComplete && startTime && endTime) 
                        ? endTime - startTime 
                        : 0;
                const cyclesDone = Math.floor(currentElapsed / (batchDuration || 1));
                const currentCycle = Math.min(totalCycles, cyclesDone + (isActive ? 1 : 0));

                return (
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
                        <span className={`text-xs font-bold tracking-widest ${isComplete ? 'text-green-200/50' : 'text-blue-200/50'}`}>
                            SLOT {i+1} {(isActive || isComplete) && <span className="text-[10px] opacity-70 ml-1">({currentCycle}/{totalCycles})</span>}
                        </span>
                    </div>
                </div>
            ); })}
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
