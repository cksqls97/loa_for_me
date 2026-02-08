import React from 'react';

interface MaterialInputsProps {
  targetSlots: number;
  setTargetSlots: (val: number) => void;
  ownedRare: number;
  setOwnedRare: (val: number) => void;
  ownedUncommon: number;
  setOwnedUncommon: (val: number) => void;
  ownedCommon: number;
  setOwnedCommon: (val: number) => void;
  prices: { rare: number, uncommon: number, common: number };
  bundleCounts: { rare: number, uncommon: number, common: number };
}

export default function MaterialInputs({
  targetSlots,
  setTargetSlots,
  ownedRare,
  setOwnedRare,
  ownedUncommon,
  setOwnedUncommon,
  ownedCommon,
  setOwnedCommon,
  prices,
  bundleCounts
}: MaterialInputsProps) {
  return (
    <div className="space-y-4 relative z-10">
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">목표 제작 슬롯</label>
            <div className="flex items-center gap-3">
                <input 
                    type="number" 
                    value={targetSlots} 
                    onChange={(e) => setTargetSlots(Number(e.target.value))}
                    min="1" 
                    className="w-full bg-transparent text-4xl font-black text-white focus:outline-none placeholder-slate-700"
                />
                <span className="text-base font-bold text-slate-500 whitespace-nowrap">슬롯</span>
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between items-end px-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">현재 보유량 (벌목 재료)</label>
                <span className="text-[10px] text-slate-600 font-medium">인게임 보유량을 입력하세요</span>
            </div>
            
            {/* Rare */}
            <div className="bg-black/30 px-4 py-2.5 rounded-2xl border border-white/5 flex items-center justify-between group/item hover:border-blue-500/30 transition-colors">
                <span className="text-sm font-bold text-blue-400 w-16 group-hover/item:text-blue-300 transition-colors">희귀</span>
                <div className="flex-1 flex flex-col items-end mr-4">
                    <input 
                        type="number" 
                        value={ownedRare} 
                        onChange={(e) => setOwnedRare(Number(e.target.value))}
                        className="w-full bg-transparent text-right font-bold text-xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-700"
                    />
                </div>
                {prices.rare > 0 && (
                    <div className="text-right text-[10px] text-slate-500 w-24 border-l border-white/5 pl-4">
                        <span className="block text-slate-400 font-mono">{prices.rare.toLocaleString()} G</span>
                        <span className="block text-[9px] uppercase">{bundleCounts.rare}개 단위</span>
                    </div>
                )}
            </div>

            {/* Uncommon */}
            <div className="bg-black/30 px-4 py-2.5 rounded-2xl border border-white/5 flex items-center justify-between group/item hover:border-emerald-500/30 transition-colors">
                <span className="text-sm font-bold text-emerald-400 w-16 group-hover/item:text-emerald-300 transition-colors">고급</span>
                <div className="flex-1 flex flex-col items-end mr-4">
                    <input 
                        type="number" 
                        value={ownedUncommon} 
                        onChange={(e) => setOwnedUncommon(Number(e.target.value))}
                        className="w-full bg-transparent text-right font-bold text-xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-700"
                    />
                </div>
                {prices.uncommon > 0 && (
                    <div className="text-right text-[10px] text-slate-500 w-24 border-l border-white/5 pl-4">
                        <span className="block text-slate-400 font-mono">{prices.uncommon.toLocaleString()} G</span>
                        <span className="block text-[9px] uppercase">{bundleCounts.uncommon}개 단위</span>
                    </div>
                )}
            </div>

            {/* Common */}
            <div className="bg-black/30 px-4 py-2.5 rounded-2xl border border-white/5 flex items-center justify-between group/item hover:border-slate-500/30 transition-colors">
                <span className="text-sm font-bold text-slate-200 w-16 group-hover/item:text-white transition-colors">일반</span>
                <div className="flex-1 flex flex-col items-end mr-4">
                    <input 
                        type="number" 
                        value={ownedCommon} 
                        onChange={(e) => setOwnedCommon(Number(e.target.value))}
                        className="w-full bg-transparent text-right font-bold text-xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-700"
                    />
                </div>
                {prices.common > 0 && (
                    <div className="text-right text-[10px] text-slate-500 w-24 border-l border-white/5 pl-4">
                        <span className="block text-slate-400 font-mono">{prices.common.toLocaleString()} G</span>
                        <span className="block text-[9px] uppercase">{bundleCounts.common}개 단위</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
