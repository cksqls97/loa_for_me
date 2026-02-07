"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LostArkService } from '../services/lostark';
import { LOGGING_MATERIALS } from '../constants/items';
import BonusSettings from './BonusSettings';
import APISettings from './APISettings';
import MaterialInputs from './MaterialInputs';
import ProfitDisplay from './ProfitDisplay';
import PurchaseRequirements from './PurchaseRequirements';

type MaterialType = 'abidos' | 'superior';

const COSTS: Record<MaterialType, { rare: number, uncommon: number, common: number, gold: number }> = {
  abidos: { rare: 33, uncommon: 45, common: 86, gold: 400 },
  superior: { rare: 43, uncommon: 59, common: 112, gold: 520 }
};

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

export default function MaterialCalculator() {
  const [activeTab, setActiveTab] = useState<MaterialType>('superior');
  const [targetSlots, setTargetSlots] = useState<number>(1);
  const [ownedRare, setOwnedRare] = useState<number>(0);
  const [ownedUncommon, setOwnedUncommon] = useState<number>(0);
  const [ownedCommon, setOwnedCommon] = useState<number>(0);
  
  // API Integration State
  const [apiKey, setApiKey] = useState<string>('');
  const [prices, setPrices] = useState<{ 
      rare: number, uncommon: number, common: number, 
      fusion: number, superiorFusion: number 
  }>({ 
      rare: 0, uncommon: 0, common: 0, 
      fusion: 0, superiorFusion: 0 
  });
  const [bundleCounts, setBundleCounts] = useState<{ 
      rare: number, uncommon: number, common: number, 
      fusion: number, superiorFusion: number 
  }>({ 
      rare: 10, uncommon: 10, common: 10, 
      fusion: 10, superiorFusion: 10 
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Bonus Stats
  const [costReduction, setCostReduction] = useState<number>(0);
  const [greatSuccessChance, setGreatSuccessChance] = useState<number>(0);

  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('matCalcData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTargetSlots(Number(data.targetSlots) || 1);
        setOwnedRare(Number(data.ownedRare) || 0);
        setOwnedUncommon(Number(data.ownedUncommon) || 0);
        setOwnedCommon(Number(data.ownedCommon) || 0);
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.apiKey) setApiKey(data.apiKey);
        if (typeof data.costReduction === 'number') setCostReduction(data.costReduction);
        if (typeof data.greatSuccessChance === 'number') setGreatSuccessChance(data.greatSuccessChance);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const data = { 
        targetSlots, 
        ownedRare, 
        ownedUncommon, 
        ownedCommon, 
        activeTab, 
        apiKey,
        costReduction,
        greatSuccessChance 
    };
    localStorage.setItem('matCalcData', JSON.stringify(data));
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, apiKey, costReduction, greatSuccessChance]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
  };

  const fetchPrices = useCallback(async (currentKey: string) => {
    if (!currentKey) return;
    
    setIsLoading(true);
    addLog("시세 자동 조회 시작...");
    
    try {
      // Include Fusion Materials in list
      const itemsToCheck = [
          { ...LOGGING_MATERIALS.rare, key: 'rare' },
          { ...LOGGING_MATERIALS.uncommon, key: 'uncommon' },
          { ...LOGGING_MATERIALS.common, key: 'common' },
          { ...LOGGING_MATERIALS.fusion, key: 'fusion' },
          { ...LOGGING_MATERIALS.superiorFusion, key: 'superiorFusion' }
      ];

      const newPrices: any = {};
      const newBundles: any = {};

      for (const item of itemsToCheck) {
           addLog(`[요청] ${item.name} (ID: ${item.id}, Cat: ${item.categoryCode})`); 
          try {
              const result = await LostArkService.getMarketPrice(currentKey, item.id, item.name, item.categoryCode);
              if (result !== null) {
                   addLog(`[수신] ${item.name}: ${result.price}G / unit: ${result.bundleCount}`);
                  newPrices[item.key] = result.price;
                  newBundles[item.key] = result.bundleCount;
              } else {
                  addLog(`[실패] ${item.name}: 데이터 없음 (result is null)`);
              }
          } catch (e: any) {
              addLog(`[에러] ${item.name}: ${e.message}`);
          }
      }

      setPrices(prev => ({ ...prev, ...newPrices }));
      setBundleCounts(prev => ({ ...prev, ...newBundles }));
      addLog("시세 업데이트 완료");

    } catch (error: any) {
      console.error(error);
      addLog(`전체 에러: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh logic
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
      if (!apiKey) return;

      fetchPrices(apiKey);

      const now = new Date();
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      
      const timeoutId = setTimeout(() => {
          fetchPrices(apiKey);
          intervalRef.current = setInterval(() => {
              fetchPrices(apiKey);
          }, 60000);
      }, msUntilNextMinute);

      return () => {
          clearTimeout(timeoutId);
          if (intervalRef.current) clearInterval(intervalRef.current);
      };
  }, [apiKey, fetchPrices]);

  const results: Results = useMemo(() => {
    const slots = Math.max(0, targetSlots);
    const owned = { rare: ownedRare, uncommon: ownedUncommon, common: ownedCommon };
    const res: any = {};
    const currentCost = COSTS[activeTab];
    
    ['rare', 'uncommon', 'common'].forEach((key) => {
      const k = key as keyof typeof owned;
      const needed = currentCost[k] * slots;
      const deficit = needed - owned[k];
      const bundle = bundleCounts[k as keyof typeof bundleCounts] || 10; 
      const buyCount = deficit <= 0 ? 0 : Math.ceil(deficit / bundle); 
      
      res[k] = { buyCount, needed, bundleSize: bundle }; 
    });
    return res as Results;
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, bundleCounts]);

  // Profit Calculation
  const profitStats = useMemo(() => {
      const slots = Math.max(0, targetSlots);
      if (slots === 0) return null;

      // Price check to avoid initial negative values
      const currentRecipe = COSTS[activeTab];
      const fusionKey = activeTab === 'abidos' ? 'fusion' : 'superiorFusion';
      const outputPrice = prices[fusionKey as keyof typeof prices];
      
      // If output price or material prices are 0, return null (loading or no data)
      if (!outputPrice) return null;
      if (prices.rare === 0 || prices.uncommon === 0 || prices.common === 0) return null;

      
      // 1. Material Cost (for ALL slots)
      let totalMaterialCost = 0;
      (['rare', 'uncommon', 'common'] as const).forEach(key => {
          const needed = currentRecipe[key] * slots;
          const price = prices[key];
          const bundle = bundleCounts[key] || 1;
          const unitPrice = price / bundle;
          totalMaterialCost += needed * unitPrice;
      });

      // 2. Gold Cost
      // Apply reduction: Gold * (1 - reduction/100)
      const baseGold = currentRecipe.gold * slots;
      const reductionMult = 1 - (costReduction / 100);
      const totalGoldCost = baseGold * reductionMult;

      // 3. Expected Revenue
      // Output Fusion items. 
      // Base: 10 per slot. 
      // Great Success: 20 per slot.
      // Probability: 5% * (1 + bonus/100)
      
      const baseProb = 0.05;
      const finalProb = baseProb * (1 + (greatSuccessChance / 100)); // e.g. 0.05 * 1.07 = 0.0535
      // Expected output per slot = 10*(1-p) + 20*p = 10 - 10p + 20p = 10 + 10p = 10 * (1 + p)
      const expectedOutputPerSlot = 10 * (1 + finalProb);
      const totalExpectedOutput = expectedOutputPerSlot * slots;

      // Price of output
      const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
      const outputUnitPrice = outputPrice / outputBundle; 

      const grossRevenue = totalExpectedOutput * outputUnitPrice;

      // Total Cost
      const totalCost = totalMaterialCost + totalGoldCost;

      // Profit Calculation
      // Selling Profit: 5% Tax on Revenue
      const sellingRevenue = grossRevenue * 0.95;
      const sellingProfit = sellingRevenue - totalCost;

      // Usage Profit: No Tax
      const usageProfit = grossRevenue - totalCost;
      
      return {
          grossRevenue,
          sellingRevenue,
          matCost: totalMaterialCost,
          goldCost: totalGoldCost,
          totalCost: totalCost,
          sellingProfit,
          usageProfit,
          outputQty: totalExpectedOutput
      };
  }, [targetSlots, activeTab, prices, bundleCounts, costReduction, greatSuccessChance]);

  const handleUpdate = () => {
     setOwnedRare(prev => {
        const data = results.rare;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });
     setOwnedUncommon(prev => {
        const data = results.uncommon;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });
     setOwnedCommon(prev => {
        const data = results.common;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });
  };

  const openPip = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert("PiP 미지원");
      return;
    }
    try {
      // @ts-ignore
      const win = await window.documentPictureInPicture.requestWindow({ width: 360, height: 600 });
      setPipWindow(win);

      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        body { background: #0f111a; color: white; font-family: 'Pretendard', sans-serif; padding: 12px 10px; margin: 0; overflow: hidden; }
        .container { display: flex; flex-direction: column; gap: 8px; }
        .tab-box { display: flex; background: #1a1d29; border-radius: 8px; padding: 2px; margin-bottom: 5px; }
        .tab-btn { flex: 1; padding: 6px; border: none; background: transparent; color: #64748b; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 6px; }
        .tab-btn.active { background: #334155; color: white; }
        .label { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 2px; display: block; }
        .input-row { display: flex; align-items: center; background: #1a1d29; border-radius: 8px; padding: 5px 10px; }
        .input-row span { font-size: 11px; font-weight: bold; width: 40px; }
        input { background: transparent; border: none; color: white; text-align: right; font-weight: 900; width: 100%; outline: none; font-size: 16px; }
        .res-box { margin-top: 5px; padding-top: 8px; border-top: 1px solid #334155; display: flex; flex-direction: column; gap: 4px; }
        .res-row { display: flex; justify-content: space-between; align-items: center; }
        .buy-val { color: #fbbf24; font-weight: 900; font-size: 20px; }
        .update-btn { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; margin-top: 8px; cursor: pointer; }
        .update-btn:active { background: #1d4ed8; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .price-tag { font-size: 10px; color: #94a3b8; margin-left: auto; }
        .profit-container { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 10px; }
        .profit-box { background: #1e293b; border-radius: 8px; padding: 10px; text-align: center; border: 1px solid #334155; }
        .profit-label { font-size: 11px; color: #94a3b8; font-weight: bold; display: block; margin-bottom: 6px; }
        .profit-val { font-size: 24px; font-weight: 900; margin-top: 4px; line-height: 1; }
        .calc-row { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 4px; }
        .calc-col { display: flex; flex-direction: column; align-items: center; }
        .calc-title { font-size: 9px; color: #64748b; font-weight: bold; margin-bottom: 2px; }
        .calc-col span:last-child { font-size: 13px; font-weight: bold; color: #e2e8f0; }
        .calc-sep { font-size: 12px; color: #475569; font-weight: bold; margin-top: 10px; }
        .val-plus { color: #34d399; }
        .val-minus { color: #f87171; }
      `;
      win.document.head.appendChild(style);

      win.addEventListener("pagehide", () => {
        setPipWindow(null);
      });
    } catch (e) {
      console.error(e);
      alert("PiP 실행 실패");
    }
  };

  return (
    <>
      <BonusSettings 
        costReduction={costReduction}
        setCostReduction={setCostReduction}
        greatSuccessChance={greatSuccessChance}
        setGreatSuccessChance={setGreatSuccessChance}
      />

      <APISettings 
        apiKey={apiKey}
        setApiKey={setApiKey}
        fetchPrices={fetchPrices}
        isLoading={isLoading}
        logs={logs}
      />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        <section className="bg-[#1a1d29]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <header className="mb-6 relative z-10">
                <h1 className="text-2xl font-black tracking-tighter text-white mb-5 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                    재료 계산기
                </h1>
                
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('abidos')}
                        className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'abidos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        <span>아비도스</span>
                        {prices.fusion > 0 && <span className="text-[10px] opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded-full">{prices.fusion} G</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('superior')}
                        className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'superior' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        <span>상급 아비도스</span>
                        {prices.superiorFusion > 0 && <span className="text-[10px] opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded-full">{prices.superiorFusion} G</span>}
                    </button>
                </div>
            </header>

            <MaterialInputs 
                targetSlots={targetSlots}
                setTargetSlots={setTargetSlots}
                ownedRare={ownedRare}
                setOwnedRare={setOwnedRare}
                ownedUncommon={ownedUncommon}
                setOwnedUncommon={setOwnedUncommon}
                ownedCommon={ownedCommon}
                setOwnedCommon={setOwnedCommon}
                prices={prices}
                bundleCounts={bundleCounts}
            />

            <div className="pt-5 border-t border-white/5 mt-6">
                <button 
                    onClick={openPip} 
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                >
                    <span>오버레이 실행</span>
                    <svg className="w-4 h-4 opacity-70 group-hover/btn:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2h10a2 2 0 00-2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
                
                <ProfitDisplay profitStats={profitStats} />
            </div>
        </section>

        <PurchaseRequirements 
            activeTab={activeTab}
            results={results}
            prices={prices}
        />
      </div>

      {pipWindow && createPortal(
        <div className="container">
             <div className="tab-box">
                <button 
                    className={`tab-btn ${activeTab === 'abidos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('abidos')}
                >
                    아비도스
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'superior' ? 'active' : ''}`}
                    onClick={() => setActiveTab('superior')}
                >
                    상급 아비도스
                </button>
            </div>

            <div>
                <label className="label">목표 슬롯</label>
                <div className="input-row">
                    <input type="number" value={targetSlots} onChange={(e) => setTargetSlots(Number(e.target.value))} />
                </div>
            </div>
            <div>
                <label className="label">보유량</label>
                <div className="input-row" style={{ marginBottom: 4 }}>
                    <span style={{ color: '#3b82f6' }}>희귀</span>
                    <input type="number" value={ownedRare} onChange={(e) => setOwnedRare(Number(e.target.value))} />
                </div>
                {prices.rare > 0 && <div className="price-tag">{prices.rare} G</div>}
                <div className="input-row" style={{ marginBottom: 4 }}>
                    <span style={{ color: '#1eff00' }}>고급</span>
                    <input type="number" value={ownedUncommon} onChange={(e) => setOwnedUncommon(Number(e.target.value))} />
                </div>
                {prices.uncommon > 0 && <div className="price-tag">{prices.uncommon} G</div>}
                <div className="input-row">
                    <span style={{ color: '#ffffff' }}>일반</span>
                    <input type="number" value={ownedCommon} onChange={(e) => setOwnedCommon(Number(e.target.value))} />
                </div>
                {prices.common > 0 && <div className="price-tag">{prices.common} G</div>}
            </div>
            <div className="res-box">
                {[
                    { key: 'rare', label: '희귀', color: '#3b82f6' },
                    { key: 'uncommon', label: '고급', color: '#1eff00' },
                    { key: 'common', label: '일반', color: '#ffffff' }
                ].map(({ key, label, color }) => {
                    const data = results[key as keyof Results];
                    return (
                        <div key={key} className="res-row">
                            <span style={{ fontSize: 13, fontWeight: 'bold', color }}>{label}</span>
                            <span className="buy-val">
                                {data.buyCount > 0 ? (
                                    <>{data.buyCount}<span style={{ fontSize: 12, fontWeight: 'normal', color: '#64748b' }}>회</span></>
                                ) : (
                                    <span style={{ color: '#475569', fontSize: 14 }}>충분</span>
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>
            {profitStats && (
                <div className="profit-container">
                    <div className="profit-box" style={{ borderColor: profitStats.sellingProfit >= 0 ? '#34d39966' : '#f8717166' }}>
                         <span className="profit-label">판매 시 (수수료 5%)</span>
                         <div className="calc-row">
                            <span style={{color:'#94a3b8'}}>매출</span> 
                            {Math.floor(profitStats.sellingRevenue).toLocaleString()} 
                            <span style={{color:'#64748b'}}>-</span> 
                            <span style={{color:'#94a3b8'}}>비용</span> 
                            {Math.floor(profitStats.totalCost).toLocaleString()}
                         </div>
                         <div className={`profit-val ${profitStats.sellingProfit >= 0 ? 'val-plus' : 'val-minus'}`}>
                             {profitStats.sellingProfit >= 0 ? '+' : ''}{Math.floor(profitStats.sellingProfit).toLocaleString()}
                         </div>
                    </div>
                </div>
            )}
            <button className="update-btn" onClick={handleUpdate}>제작 완료 (보유량 업데이트)</button>
        </div>,
        pipWindow.document.body
      )}
    </>
  );
}
