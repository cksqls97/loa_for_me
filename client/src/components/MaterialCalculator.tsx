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

interface CraftingEntry {
  id: string;
  timestamp: number;
  type: MaterialType;
  unitCost: number;
  totalCost: number;
  expectedOutput: number;
  expectedProfit: number;
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
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Bonus Stats
  const [costReduction, setCostReduction] = useState<number | null>(null);
  const [greatSuccessChance, setGreatSuccessChance] = useState<number | null>(null);

  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isPriceLoaded, setIsPriceLoaded] = useState<boolean>(false);
  const [enableTransition, setEnableTransition] = useState<boolean>(false);
  
  // History State
  const [view, setView] = useState<'calculator' | 'history'>('calculator');
  const [history, setHistory] = useState<CraftingEntry[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

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
        if (data.history) setHistory(data.history);
      } catch (e) { console.error(e); }
    }
    setIsInitialized(true);
    
    // Enable transitions after initial render to prevent flash
    const timer = setTimeout(() => setEnableTransition(true), 100);
    return () => clearTimeout(timer);
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
        greatSuccessChance,
        history
    };
    localStorage.setItem('matCalcData', JSON.stringify(data));
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, apiKey, costReduction, greatSuccessChance, history]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
  };

  const fetchPrices = useCallback(async (currentKey: string) => {
    if (!currentKey) return;
    
    setApiError(null);
    setIsPriceLoaded(false);

    // Sanitize and Validate Key
    const cleanKey = currentKey.trim();
    if (/[^\x00-\x7F]/.test(cleanKey)) {
        const errorMsg = "API Key에 허용되지 않는 문자(한글/특수문자)가 포함되어 있습니다.";
        addLog(`[오류] ${errorMsg}`);
        setApiError(errorMsg);
        setIsLoading(false);
        return;
    }

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
              const result = await LostArkService.getMarketPrice(cleanKey, item.id, item.name, item.categoryCode);
              if (result !== null) {
                   addLog(`[수신] ${item.name}: ${result.price}G / unit: ${result.bundleCount}`);
                  newPrices[item.key] = result.price;
                  newBundles[item.key] = result.bundleCount;
              } else {
                  addLog(`[실패] ${item.name}: 데이터 없음 (result is null)`);
              }
          } catch (e: any) {
              const errMsg = e instanceof Error ? e.message : String(e);
              addLog(`[에러] ${item.name}: ${errMsg}`);
              if (errMsg.includes('401') || errMsg.includes('403')) {
                  throw new Error("API Key 인증 실패 (401/403)");
              }
          }
      }

      setPrices(prev => ({ ...prev, ...newPrices }));
      setBundleCounts(prev => ({ ...prev, ...newBundles }));
      setIsPriceLoaded(true);
      addLog("시세 업데이트 완료");

    } catch (error: any) {
      // console.error(error);
      const msg = error instanceof Error ? error.message : String(error) || "시세 조회 중 오류 발생";
      addLog(`전체 에러: ${msg}`);
      setApiError(msg);
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
      const reductionMult = 1 - ((costReduction || 0) / 100);
      const totalGoldCost = baseGold * reductionMult;

      // 3. Expected Revenue
      // Output Fusion items. 
      // Base: 10 per slot. 
      // Great Success: 20 per slot.
      // Probability: 5% * (1 + bonus/100)
      
      const baseProb = 0.05;
      const finalProb = baseProb * (1 + ((greatSuccessChance || 0) / 100)); // e.g. 0.05 * 1.07 = 0.0535
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

  const saveHistory = useCallback(() => {
    // Calculate Unit Cost based on Standard Recipe (ignoring owned counts)
    // 1. Current Price specific to activeTab
    const currentRecipe = COSTS[activeTab];
    const slots = targetSlots;
    if (slots <= 0) return;

    // Material Cost
    let matCost = 0;
    (['rare', 'uncommon', 'common'] as const).forEach(key => {
       const needed = currentRecipe[key] * slots;
       const price = prices[key];
       const bundle = bundleCounts[key] || 1;
       const unitPrice = price / bundle;
       matCost += needed * unitPrice;
    });

    // Gold Cost
    const baseGold = currentRecipe.gold * slots;
    const reductionMult = 1 - ((costReduction || 0) / 100);
    const goldCost = baseGold * reductionMult;

    const totalCost = matCost + goldCost;

    // Expected Output
    // Output per slot = 10 * (1 + prob)
    const baseProb = 0.05;
    const finalProb = baseProb * (1 + ((greatSuccessChance || 0) / 100));
    const outputPerSlot = 10 * (1 + finalProb);
    const expectedOutput = outputPerSlot * slots;

    // Unit Cost
    const unitCost = totalCost / expectedOutput;

    // Expected Profit
    const fusionKey = activeTab === 'abidos' ? 'fusion' : 'superiorFusion';
    const outputPrice = prices[fusionKey as keyof typeof prices] || 0;
    const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
    const outputUnitPrice = outputBundle > 0 ? (outputPrice / outputBundle) : 0;
    
    // Revenue (Net after 5% tax)
    const totalRevenue = (expectedOutput * outputUnitPrice) * 0.95;
    const expectedProfit = totalRevenue - totalCost;

    addLog(`[디버그] ${fusionKey} 가격: ${outputPrice}, 번들: ${outputBundle}, 개당가격: ${outputUnitPrice}, 예상수익: ${expectedProfit}`);

    const newEntry: CraftingEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: activeTab,
      unitCost,
      totalCost,
      expectedOutput,
      expectedProfit
    };

    setHistory(prev => [newEntry, ...prev]);
    addLog(`[기록] 제작 완료 - 이익: ${Math.floor(expectedProfit).toLocaleString()}G`);
  }, [activeTab, targetSlots, prices, bundleCounts, costReduction, greatSuccessChance]);

  const deleteHistory = (id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
  };
   
  const totalProfit = useMemo(() => {
    return history.reduce((sum, entry) => sum + (entry.expectedProfit || 0), 0);
  }, [history]);

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

     saveHistory();
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
        .profit-split-container { display: flex; background: #1e293b; border-radius: 8px; margin-top: 10px; overflow: hidden; border: 1px solid #334155; }
        .profit-split-item { flex: 1; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        .profit-split-item:first-child { border-right: 1px solid #334155; }
        .profit-label { font-size: 10px; color: #94a3b8; font-weight: bold; margin-bottom: 4px; }
        .profit-val { font-size: 18px; font-weight: 900; line-height: 1; }
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

  const isConfigured = !!apiKey && costReduction !== null && greatSuccessChance !== null && !apiError;
  const isFullyReady = isConfigured && isPriceLoaded;

  if (!isInitialized) return <div className="min-h-screen bg-[#0f111a]" />;

  // Animation Classes
  // Fixed: Use origin-center consistently to prevent animation artifacts.
  const bonusClass = `fixed z-50 flex flex-col items-start transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      isConfigured 
      ? 'top-6 left-6 -translate-x-0 -translate-y-0 scale-100' 
      : 'top-1/2 left-1/2 -translate-x-[55%] -translate-y-[160%] md:-translate-y-[40%] md:-translate-x-[115%] scale-110 md:scale-125'
  }`;

  const apiClass = `fixed z-50 flex flex-col items-end transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      isConfigured 
      ? 'top-6 right-6 -translate-x-0 -translate-y-0 scale-100' 
      : 'top-1/2 right-1/2 translate-x-[55%] translate-y-[60%] md:-translate-y-[40%] md:translate-x-[115%] scale-110 md:scale-125'
  }`;

  const titleClass = `fixed left-1/2 -translate-x-1/2 transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col items-center whitespace-nowrap pointer-events-none ${
      isConfigured
      ? 'top-6 scale-75'
      : 'top-[20%] scale-100'
  }`;

  return (
    <>
      <div 
          className={`fixed inset-0 bg-[#0f111a]/95 backdrop-blur-md z-40 pointer-events-none flex flex-col items-center justify-center ${isConfigured ? 'opacity-0 invisible' : 'opacity-100'}`}
          style={{ 
            transition: enableTransition 
                ? `opacity 1s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear ${isConfigured ? '1s' : '0s'}`
                : 'none' 
          }}
      >
          <div className="absolute top-[20%] text-center space-y-3 px-4 pt-16">
              {/* Title Placeholder to keep spacing for subtext if needed, or just remove title from here */}
              <p className="text-slate-400 text-sm md:text-base font-medium transition-opacity duration-500 delay-200">
                  정확한 이득 계산을 위해 <span className="text-white font-bold">API Key</span>와 <span className="text-white font-bold">제작 보너스</span>를 설정해주세요.
              </p>
          </div>
      </div>

      {/* Animated Title */}
      <div className={titleClass}>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-2xl flex items-center gap-2 mb-4">
                <span className="text-blue-500">Lost Ark</span> Material Calculator
            </h1>
            
            {/* View Toggle */}
            <div className={`flex bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10 transition-all duration-500 delay-200 pointer-events-auto ${isConfigured ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button 
                  onClick={() => setView('calculator')}
                  className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${view === 'calculator' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                  재료 계산기
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-black shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                  제작 기록
                </button>
            </div>
      </div>

      {/* Settings Layer */}
      <BonusSettings 
        costReduction={costReduction}
        setCostReduction={setCostReduction}
        greatSuccessChance={greatSuccessChance}
        setGreatSuccessChance={setGreatSuccessChance}
        className={bonusClass}
        forceExpanded={!isConfigured}
      />

      <APISettings 
        apiKey={apiKey}
        setApiKey={setApiKey}
        fetchPrices={fetchPrices}
        isLoading={isLoading}
        logs={logs}
        className={apiClass}
        forceExpanded={!isConfigured}
        apiError={apiError}
      />

      {/* Main Content Layer */}
      {/* Added pt-32 to separate from fixed title and toggle */}
      <div className={`max-w-5xl w-full relative transition-opacity duration-1000 pt-32 ${isFullyReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
        
        {view === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[#1a1d29]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <header className="mb-6 relative z-10">
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
        ) : (
          <section className="bg-[#1a1d29]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"/>
                    제작 기록
                    <span className="text-xs font-normal text-slate-500 ml-2">최신순 정렬</span>
                </h2>
                {history.length > 0 && (
                    <button 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDeleteMode ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {isDeleteMode ? '편집 완료' : '목록 편집'}
                    </button>
                )}
              </div>
              
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border border-slate-600">
                        <thead className="bg-[#2d3748] text-slate-300 font-bold whitespace-nowrap">
                            <tr>
                                <th className="border border-slate-600 px-3 py-2">시간</th>
                                <th className="border border-slate-600 px-3 py-2">종류</th>
                                <th className="border border-slate-600 px-3 py-2 text-right">단가</th>
                                <th className="border border-slate-600 px-3 py-2 text-right">총 비용</th>
                                <th className="border border-slate-600 px-3 py-2 text-right">예상 결과</th>
                                <th className="border border-slate-600 px-3 py-2 text-right">예상 수익</th>
                                {isDeleteMode && <th className="border border-slate-600 px-3 py-2 text-center w-[50px] bg-red-900/20 text-red-200">삭제</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((entry) => (
                                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                    <td className="border border-slate-600 px-3 py-2 text-slate-400 font-mono text-xs whitespace-nowrap">
                                        {new Date(entry.timestamp).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-600 px-3 py-2 whitespace-nowrap">
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${entry.type === 'abidos' ? 'text-blue-400 bg-blue-400/10' : 'text-indigo-400 bg-indigo-400/10'}`}>
                                            {entry.type === 'abidos' ? '아비도스' : '상급 아비도스'}
                                        </span>
                                    </td>
                                    <td className="border border-slate-600 px-3 py-2 text-right font-bold text-blue-400 whitespace-nowrap">
                                        {Math.floor(entry.unitCost).toLocaleString()} G
                                    </td>
                                    <td className="border border-slate-600 px-3 py-2 text-right text-slate-300 whitespace-nowrap">
                                        {Math.floor(entry.totalCost).toLocaleString()} G
                                    </td>
                                    <td className="border border-slate-600 px-3 py-2 text-right text-slate-300 whitespace-nowrap">
                                        {Math.floor(entry.expectedOutput).toLocaleString()} 개
                                    </td>
                                    <td className={`border border-slate-600 px-3 py-2 text-right font-bold whitespace-nowrap ${entry.expectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {entry.expectedProfit > 0 ? '+' : ''}{Math.floor(entry.expectedProfit || 0).toLocaleString()} G
                                    </td>
                                    {isDeleteMode && (
                                        <td className="border border-slate-600 px-3 py-2 text-center bg-red-900/10">
                                            <button 
                                                onClick={() => deleteHistory(entry.id)}
                                                className="text-white bg-red-500 hover:bg-red-600 transition-colors w-6 h-6 rounded flex items-center justify-center mx-auto"
                                                title="삭제"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-[#1a202c] font-bold">
                            <tr>
                                <td colSpan={5} className="border border-slate-600 px-3 py-3 text-right text-slate-300">
                                    총 예상 수익 합계
                                </td>
                                <td className={`border border-slate-600 px-3 py-3 text-right text-lg ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {totalProfit > 0 ? '+' : ''}{Math.floor(totalProfit).toLocaleString()} G
                                </td>
                                {isDeleteMode && <td className="border border-slate-600 bg-[#1a202c]"></td>}
                            </tr>
                        </tfoot>
                    </table>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500">
                    <p className="mb-2 text-4xl">📝</p>
                    <p>아직 제작 기록이 없습니다.</p>
                    <p className="text-sm mt-2">화면 공유(오버레이) 모드에서 '제작 완료'를 눌러 기록해보세요.</p>
                </div>
              )}
          </section>
        )}
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
                <div className="profit-split-container">
                    <div className="profit-split-item">
                         <span className="profit-label">판매 시 (수수료 5%)</span>
                         <div className={`profit-val ${profitStats.sellingProfit >= 0 ? 'val-plus' : 'val-minus'}`}>
                             {profitStats.sellingProfit >= 0 ? '+' : ''}{Math.floor(profitStats.sellingProfit).toLocaleString()}
                         </div>
                    </div>
                    <div className="profit-split-item">
                         <span className="profit-label">사용 시 (수수료 없음)</span>
                         <div className={`profit-val ${profitStats.usageProfit >= 0 ? 'val-plus' : 'val-minus'}`}>
                             {profitStats.usageProfit >= 0 ? '+' : ''}{Math.floor(profitStats.usageProfit).toLocaleString()}
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
