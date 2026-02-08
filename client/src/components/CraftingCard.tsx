import React, { useState, useEffect } from 'react';

interface CraftingCardProps {
  type: 'abidos' | 'superior';
  isActive: boolean;
  endTime: number | null;
  slotIndex?: number;
}

export default function CraftingCard({ type, isActive, endTime, slotIndex = 0 }: CraftingCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!isActive || !endTime) {
       setTimeLeft('');
       return;
    }

    const updateTimer = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        // Parent handles completion state switch
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const itemName = type === 'abidos' ? '아비도스 융화 재료' : '상급 아비도스 융화 재료';

  return (
    <div 
      className="w-full relative overflow-hidden rounded-lg border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] bg-gradient-to-b from-slate-800/90 to-slate-900/95 group transition-transform duration-300"
    >
      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
      
      {/* Content Container */}
      <div className="p-4 flex flex-col items-center justify-center gap-3 relative z-10">
          {/* Header / Timer */}
          <div className="text-center">
              <h3 className="text-sm font-bold text-blue-200 tracking-wider mb-1 opacity-80">
                  {itemName}
              </h3>
              {isActive ? (
                   <div className="text-2xl font-black text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] font-mono">
                      {timeLeft || 'Calculating...'}
                   </div>
              ) : (
                   <h3 className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] tracking-wider">
                      제작 완료!
                   </h3>
              )}
          </div>
          
          {/* Item Slots Row */}
          <div className="flex gap-1.5 px-4 py-2 bg-black/40 rounded border border-blue-500/20 shadow-inner">
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)] border ${isActive ? 'bg-blue-500/20 border-blue-400/50' : 'bg-cyan-500/20 border-cyan-400/50'}`}>
                  {isActive ? (
                      <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                      <span className="text-cyan-300 font-bold text-lg">!</span>
                  )}
              </div>
              
              {/* Item Icons (10 items) */}
              {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`w-8 h-8 bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-400/40 rounded flex items-center justify-center relative overflow-hidden ${isActive ? 'opacity-50' : 'opacity-100'}`}>
                       <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                       {/* Shine effect only when complete or active animation? Let's add simple shine */}
                       <div className="absolute inset-0 bg-white/20 rotate-45 translate-x-[-100%] animate-[shine_3s_infinite]" style={{ animationDelay: `${i * 0.1}s` }} />
                  </div>
              ))}
          </div>
      </div>

      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none ${isActive ? 'from-blue-900/20' : 'from-blue-600/10'} to-transparent`} />
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] ${isActive ? 'animate-pulse' : ''}`} />
      
      {/* Progress Bar for Active State */}
      {isActive && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] transition-all duration-1000" style={{ width: '100%', opacity: 0.5 }} />
      )}
    </div>
  );
}
