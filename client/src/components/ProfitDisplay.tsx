import React from 'react';

interface ProfitStats {
  grossRevenue: number;
  sellingRevenue: number;
  matCost: number;
  goldCost: number;
  totalCost: number;
  sellingProfit: number;
  usageProfit: number;
  outputQty: number;
  hourlySellingProfit: number;
  hourlyUsageProfit: number;
}

interface ProfitDisplayProps {
  profitStats: ProfitStats | null;
}

export default function ProfitDisplay({ profitStats }: ProfitDisplayProps) {
  if (!profitStats) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Selling Profit */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${profitStats.sellingProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'}`}>
            <h4 className={`text-center text-[10px] font-bold mb-3 uppercase tracking-widest ${profitStats.sellingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                판매 시 수익 (수수료 5%)
            </h4>
            
            <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-emerald-400/70 uppercase tracking-wider text-[10px]">Revenue</span>
                <span className="text-white tracking-wide">{Math.floor(profitStats.sellingRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-red-400/70 uppercase tracking-wider text-[10px]">Cost</span>
                <span className="text-red-200/80 tracking-wide">-{Math.floor(profitStats.totalCost).toLocaleString()}</span>
            </div>
            </div>

            <div className="flex flex-col items-center pt-1">
                <span className={`text-[9px] font-extrabold mb-1 uppercase tracking-[0.2em] ${profitStats.sellingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    NET PROFIT
                </span>
                <span className={`text-3xl font-black tracking-tight ${profitStats.sellingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitStats.sellingProfit >= 0 ? '+' : ''}{Math.floor(profitStats.sellingProfit).toLocaleString()} <span className="text-sm font-bold opacity-50">G</span>
                </span>
            </div>

            {/* Hourly Profit */}
            <div className="mt-4 pt-3 border-t border-white/5 w-full flex justify-between items-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">시간당 수익</span>
                <span className={`text-sm font-bold font-mono ${profitStats.sellingProfit >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                    {Math.floor(profitStats.hourlySellingProfit).toLocaleString()} G/h
                </span>
            </div>
        </div>
        
        {/* Usage Profit */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${profitStats.usageProfit >= 0 ? 'bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10' : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'}`}>
            <h4 className={`text-center text-[10px] font-bold mb-3 uppercase tracking-widest ${profitStats.usageProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                본인 사용 이득
            </h4>
            
            <div className="bg-black/20 rounded-xl p-3 mb-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-sky-400/70 uppercase tracking-wider text-[10px]">Value</span>
                <span className="text-white tracking-wide">{Math.floor(profitStats.grossRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-red-400/70 uppercase tracking-wider text-[10px]">Cost</span>
                <span className="text-red-200/80 tracking-wide">-{Math.floor(profitStats.totalCost).toLocaleString()}</span>
            </div>
            </div>

            <div className="flex flex-col items-center pt-1">
                <span className={`text-[9px] font-extrabold mb-1 uppercase tracking-[0.2em] ${profitStats.usageProfit >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                    SAVED
                </span>
                <span className={`text-3xl font-black tracking-tight ${profitStats.usageProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                    {profitStats.usageProfit >= 0 ? '+' : ''}{Math.floor(profitStats.usageProfit).toLocaleString()} <span className="text-sm font-bold opacity-50">G</span>
                </span>
            </div>

            {/* Hourly Profit */}
            <div className="mt-4 pt-3 border-t border-white/5 w-full flex justify-between items-center px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">시간당 이득</span>
                <span className={`text-sm font-bold font-mono ${profitStats.usageProfit >= 0 ? 'text-sky-400/80' : 'text-red-400/80'}`}>
                    {Math.floor(profitStats.hourlyUsageProfit).toLocaleString()} G/h
                </span>
            </div>
        </div>
    </div>
  );
}
