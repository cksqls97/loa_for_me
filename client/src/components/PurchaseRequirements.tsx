import React from 'react';
import { LOGGING_MATERIALS } from '../constants/items';

interface CalculationResult {
  buyCount: number;
  needed: number;
  bundleSize: number;
}

interface Results {
  rare: CalculationResult;
  uncommon: CalculationResult;
  common: CalculationResult;
}

interface PurchaseRequirementsProps {
  activeTab: 'abidos' | 'superior';
  results: Results;
  prices: { rare: number, uncommon: number, common: number };
}

export default function PurchaseRequirements({
  activeTab,
  results,
  prices
}: PurchaseRequirementsProps) {

  const calculateCost = (key: 'rare' | 'uncommon' | 'common') => {
    const data = results[key];
    if (data.buyCount <= 0) return 0;
    const pricePerBundle = prices[key];
    return data.buyCount * pricePerBundle;
  };

  return (
    <section className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-4 flex flex-col relative overflow-hidden shrink-0">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
            구매 필요 횟수 ({activeTab === 'abidos' ? '아비도스' : '상급 아비도스'})
        </h2>
        <div className="grid grid-cols-3 gap-2">
            {[
            { key: 'rare', label: LOGGING_MATERIALS.rare.name, color: '#3b82f6', bg: 'bg-blue-500/10' },
            { key: 'uncommon', label: LOGGING_MATERIALS.uncommon.name, color: '#10b981', bg: 'bg-emerald-500/10' },
            { key: 'common', label: LOGGING_MATERIALS.common.name, color: '#f8fafc', bg: 'bg-slate-500/10' }
            ].map(({ key, label, color, bg }) => {
                const k = key as keyof Results;
                const data = results[k];
                const cost = calculateCost(k);
                const isCompleted = data.buyCount <= 0;

                return (
                <div key={key} className={`group flex flex-col p-3 rounded-2xl transition-all duration-300 ${isCompleted ? 'bg-white/[0.02] border border-white/[0.02] opacity-50 hover:opacity-100' : `bg-black/20 border border-white/5 hover:border-white/10`}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold tracking-tight truncate" style={{ color }}>{label}</span>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-xl font-black tracking-tighter ${isCompleted ? 'text-slate-600' : 'text-white'}`}>
                            {data.buyCount}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                            회 <span className="text-slate-700 font-medium ml-0.5">({data.bundleSize})</span>
                        </span>
                    </div>

                    <div className={`mt-2 pt-2 border-t border-white/5 flex flex-col gap-0.5 ${cost > 0 ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Est. Cost</span>
                        <span className="text-xs font-bold text-amber-500/90 font-mono">
                            {cost.toLocaleString()} <span className="text-[9px] text-amber-500/50">G</span>
                        </span>
                    </div>
                </div>
                );
            })}
        </div>
    </section>
  );
}
