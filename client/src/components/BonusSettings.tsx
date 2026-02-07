import React, { useState } from 'react';

interface BonusSettingsProps {
  costReduction: number | null;
  setCostReduction: (val: number | null) => void;
  greatSuccessChance: number | null;
  setGreatSuccessChance: (val: number | null) => void;
  className?: string;
  forceExpanded?: boolean;
}

export default function BonusSettings({
  costReduction,
  setCostReduction,
  greatSuccessChance,
  setGreatSuccessChance,
  className = "fixed top-6 left-6 z-50 flex flex-col items-start pointer-events-none",
  forceExpanded = false
}: BonusSettingsProps) {
  const [showBonus, setShowBonus] = useState(false);
  const isOpen = showBonus || forceExpanded;

  return (
    <div className={className}>
      <button 
          onClick={() => setShowBonus(!showBonus)}
          disabled={forceExpanded}
          className={`pointer-events-auto px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white border border-white/10 rounded-lg text-sm font-bold transition-all shadow-lg ${forceExpanded ? 'opacity-50 cursor-default' : ''}`}
      >
          {isOpen ? (forceExpanded ? '필수 설정' : '보너스 설정 닫기') : '제작 보너스 설정'}
      </button>
      
      {isOpen && (
          <div className={`pointer-events-auto mt-3 w-80 bg-[#0f111a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 origin-top-left ${forceExpanded ? 'h-60 flex flex-col justify-center' : ''}`}>
              <div className="flex flex-col gap-4">
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">제작 수수료 감소 (%)</label>
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-3">
                          <input 
                              type="number"
                              value={costReduction ?? ''}
                              onChange={(e) => setCostReduction(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-white focus:outline-none"
                              placeholder="0"
                          />
                          <span className="text-xs text-slate-500 font-bold ml-2">%</span>
                      </div>
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">대성공 확률 (%)</label>
                      <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-3">
                          <input 
                              type="number"
                              value={greatSuccessChance ?? ''}
                              onChange={(e) => setGreatSuccessChance(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-white focus:outline-none"
                              placeholder="0"
                          />
                          <span className="text-xs text-slate-500 font-bold ml-2">%</span>
                      </div>
                       <p className="text-[10px] text-slate-500 mt-1">* 기본 5%에 {greatSuccessChance || 0}% 증폭 (최종 {(0.05 * (1 + (greatSuccessChance || 0)/100) * 100).toFixed(2)}%)</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
