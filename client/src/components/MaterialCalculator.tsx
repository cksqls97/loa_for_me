"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LostArkService } from '../services/lostark';
import { LOGGING_MATERIALS } from '../constants/items';
import BonusSettings from './BonusSettings';
import APISettings from './APISettings';
import MaterialInputs from './MaterialInputs';
import ProfitDisplay from './ProfitDisplay';
import ThemeSelector from './ThemeSelector';

import PurchaseRequirements from './PurchaseRequirements';
import HistoryView from './HistoryView';
import CraftingStatus from './CraftingStatus';
import CraftingCard from './CraftingCard';

type MaterialType = 'abidos' | 'superior';

const COSTS: Record<MaterialType, { rare: number, uncommon: number, common: number, gold: number }> = {
  abidos: { rare: 33, uncommon: 45, common: 86, gold: 400 },
  superior: { rare: 43, uncommon: 59, common: 112, gold: 520 }
};

interface CalculationResult {
  buyCount: number;
  needed: number;
  bundleSize: number;
  cost: number;
}

interface Results {
  rare: CalculationResult;
  uncommon: CalculationResult;
  common: CalculationResult;
  totalMissingCost: number;
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
  const [ninavBlessing, setNinavBlessing] = useState<boolean>(false);
  const [timeReduction, setTimeReduction] = useState<number | null>(null);

  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isPriceLoaded, setIsPriceLoaded] = useState<boolean>(false);
  const [enableTransition, setEnableTransition] = useState<boolean>(false);
  
  // History State
  const [view, setView] = useState<'calculator' | 'history'>('calculator');
  const [history, setHistory] = useState<CraftingEntry[]>([]);

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
        if (typeof data.ninavBlessing === 'boolean') setNinavBlessing(data.ninavBlessing);
        if (typeof data.timeReduction === 'number') setTimeReduction(data.timeReduction);
        if (data.history) setHistory(data.history);
        
        // Auto-start if all configuration is present
        if (data.apiKey && 
            typeof data.costReduction === 'number' && 
            typeof data.greatSuccessChance === 'number' && 
            typeof data.timeReduction === 'number') {
            setHasEntered(true);
        }
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
        ninavBlessing,
        timeReduction,
        history
    };
    localStorage.setItem('matCalcData', JSON.stringify(data));
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, apiKey, costReduction, greatSuccessChance, ninavBlessing, timeReduction, history]);

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
    const res: any = { totalMissingCost: 0 };
    const currentCost = COSTS[activeTab];
    
    ['rare', 'uncommon', 'common'].forEach((key) => {
      const k = key as keyof typeof owned;
      const needed = currentCost[k] * slots;
      const deficit = needed - owned[k];
      const bundle = bundleCounts[k as keyof typeof bundleCounts] || 10; 
      const buyCount = deficit <= 0 ? 0 : Math.ceil(deficit / bundle); 
      
      const price = prices[k as keyof typeof prices] || 0;
      const cost = buyCount * price;
      
      res[k] = { buyCount, needed, bundleSize: bundle, cost }; 
      res.totalMissingCost += cost;
    });
    return res as Results;
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, bundleCounts, prices]);

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
     startCrafting();
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

      // Get current theme variables
      const computedStyle = getComputedStyle(document.body);
      
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --bg-main: ${computedStyle.getPropertyValue('--bg-main')};
          --bg-panel: ${computedStyle.getPropertyValue('--bg-panel')};
          --text-primary: ${computedStyle.getPropertyValue('--text-primary')};
          --text-secondary: ${computedStyle.getPropertyValue('--text-secondary')};
          --color-primary: ${computedStyle.getPropertyValue('--color-primary')};
          --color-secondary: ${computedStyle.getPropertyValue('--color-secondary')};
          --color-accent: ${computedStyle.getPropertyValue('--color-accent')};
          --color-success: ${computedStyle.getPropertyValue('--color-success')};
          --color-danger: ${computedStyle.getPropertyValue('--color-danger')};
          --border-color: ${computedStyle.getPropertyValue('--border-color')};
        }
        * { box-sizing: border-box; }
        body { background: var(--bg-main); color: var(--text-primary); font-family: 'Pretendard', sans-serif; padding: 12px 10px; margin: 0; overflow: hidden; transition: background 0.5s; }
        .container { display: flex; flex-direction: column; gap: 8px; }
        .tab-box { display: flex; background: var(--bg-panel); border-radius: 8px; padding: 2px; margin-bottom: 5px; }
        .tab-btn { flex: 1; padding: 6px; border: none; background: transparent; color: var(--text-secondary); font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 6px; }
        .tab-btn.active.abidos { background: var(--color-primary); color: white; }
        .tab-btn.active.superior { background: var(--color-secondary); color: white; }
        .label { font-size: 11px; font-weight: bold; color: var(--text-secondary); margin-bottom: 2px; display: block; }
        .input-row { display: flex; align-items: center; background: var(--bg-panel); border-radius: 8px; padding: 5px 10px; border: 1px solid var(--border-color); }
        .input-row span { font-size: 11px; font-weight: bold; }
        input { background: transparent; border: none; color: var(--text-primary); text-align: right; font-weight: 900; width: 100%; outline: none; font-size: 16px; font-family: inherit; }
        .res-box { margin-top: 5px; padding-top: 8px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; }
        .res-row { display: flex; justify-content: space-between; align-items: center; }
        .buy-val { color: var(--color-accent); font-weight: 900; font-size: 20px; }
        .update-btn { width: 100%; padding: 10px; background: linear-gradient(to right, var(--color-primary), var(--color-secondary)); color: white; border: none; border-radius: 8px; font-weight: bold; margin-top: 8px; cursor: pointer; }
        .update-btn:active { filter: brightness(0.9); transform: scale(0.98); }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .price-tag { font-size: 10px; color: var(--text-secondary); font-weight: bold; }
        .profit-split-container { display: flex; background: var(--bg-panel); border-radius: 8px; margin-top: 10px; overflow: hidden; border: 1px solid var(--border-color); }
        .profit-split-item { flex: 1; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        .profit-split-item:first-child { border-right: 1px solid var(--border-color); }
        .profit-label { font-size: 10px; color: var(--text-secondary); font-weight: bold; margin-bottom: 4px; }
        .profit-val { font-size: 18px; font-weight: 900; line-height: 1; }
        .val-plus { color: var(--color-success); }
        .val-minus { color: var(--color-danger); }
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



  const [hasEntered, setHasEntered] = useState<boolean>(false);




  // Crafting Timer State
  const [craftingState, setCraftingState] = useState<{
    isActive: boolean;
    startTime: number | null;
    endTime: number | null;
    batchDuration: number | null;
    type: MaterialType;
    concurrency: number;
    totalSlots: number;
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('craftingState');
      if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) { console.error('Failed to parse craftingState', e); }
      }
    }
    return {
      isActive: false,
      startTime: null,
      endTime: null,
      batchDuration: null,
      type: 'superior',
      concurrency: 3,
      totalSlots: 0
    };
  });

  useEffect(() => {
    localStorage.setItem('craftingState', JSON.stringify(craftingState));
  }, [craftingState]);

  // const [showCraftingStatus, setShowCraftingStatus] = useState(false); // Removed

  // Timer Logic
  useEffect(() => {
    if (!craftingState.isActive || !craftingState.endTime) return;

    const checkTimer = setInterval(() => {
      const now = Date.now();
      const diff = craftingState.endTime! - now;

      if (diff <= 0) {
        // Complete
        setCraftingState(prev => ({ ...prev, isActive: false })); // Keep endTime to show completion status
        
        // Browser Notification
        if (Notification.permission === 'granted') {
          new Notification("제작 완료!", {
            body: `${craftingState.type === 'abidos' ? '아비도스' : '상급 아비도스'} 융화 재료 제작이 완료되었습니다.`,
            icon: '/icon.png' // Optional
          });
        }
        
        clearInterval(checkTimer);
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [craftingState]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startCrafting = () => {
    const isNinav = ninavBlessing;
    const concurrency = isNinav ? 4 : 3;
    const slots = Math.max(1, targetSlots); // Total slots to craft (e.g. 10 slots = 100 items)
    
    // Cycles calculation: How many rounds the slots need to run
    // e.g. 10 slots / 4 concurrency = 2.5 -> 3 cycles
    const cycles = Math.ceil(slots / concurrency);

    // Base Time
    // Abidos: 60m (3600s), Superior: 90m (5400s)
    // const baseTimeSec = activeTab === 'abidos' ? 3600 : 5400;
    const baseTimeSec = 1; // TEMPORARY: For testing (1 second)
    
    // Reduction
    // Input is percentage (e.g. 10) + Ninav 10
    const totalReduction = (timeReduction || 0) + (isNinav ? 10 : 0);
    const multiplier = Math.max(0, 1 - (totalReduction / 100)); // Prevent negative time
    
    // Batch Time (Time for 1 cycle)
    const singleBatchTime = baseTimeSec * multiplier;
    const batchDuration = singleBatchTime * 1000;
    
    // Total Time
    const totalTimeSec = cycles * singleBatchTime;

    const now = Date.now();
    const endTime = now + (totalTimeSec * 1000);

    setCraftingState({
      isActive: true,
      startTime: now,
      endTime,
      batchDuration,
      type: activeTab,
      concurrency,
      totalSlots: slots
    });
    
    // Also notify valid start
    addLog(`[타이머] ${activeTab === 'abidos' ? '아비도스' : '상급'} 제작 시작 (${cycles}회 반복, 총 ${Math.floor(totalTimeSec/60)}분)`);
  };

  const isConfigured = !!apiKey && costReduction !== null && greatSuccessChance !== null && timeReduction !== null && !apiError;
  const isFullyReady = hasEntered && isPriceLoaded;

  // Revert to setup if configuration becomes invalid (API Error or Missing Fields)
  useEffect(() => {
    if (hasEntered && !isConfigured) {
      setHasEntered(false);
    }
  }, [hasEntered, isConfigured]);

  // Expose function for PiP
  useEffect(() => {
    (window as any).startCrafting = startCrafting;
    return () => { (window as any).startCrafting = undefined; };
  }, [startCrafting]);

  if (!isInitialized) return <div className="min-h-screen bg-[var(--bg-main)]" />;

  // Animation Classes
  // Fixed: Enhanced smooth transitions and centered positioning
  // Removed sudden alignment changes (items-*) to prevent layout jumps
  const bonusClass = `fixed z-[60] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      hasEntered 
      ? 'top-6 left-6 scale-100 items-start translate-x-0 translate-y-0' 
      : 'top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-auto md:right-[calc(50%+16px)] md:translate-x-0 md:-translate-y-1/2 scale-95 items-center md:items-end'
  }`;

  const apiClass = `fixed z-50 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
      hasEntered 
      ? 'top-6 right-6 scale-100 items-end translate-x-0 translate-y-0' 
      : 'top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:left-[calc(50%+16px)] md:translate-x-0 md:-translate-y-1/2 scale-95 items-center md:items-start'
  }`;

  const titleClass = `fixed left-1/2 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-50 flex flex-col items-center whitespace-nowrap pointer-events-none ${
      hasEntered
      ? 'top-6 scale-75 opacity-100'
      : 'top-[5%] md:top-[7%] scale-100 opacity-100'
  }`;

  return (
    <>
      <div 
          className={`fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-md z-40 pointer-events-none flex flex-col items-center justify-center ${hasEntered ? 'opacity-0 invisible' : 'opacity-100'}`}
          style={{ 
            transition: enableTransition 
                ? `opacity 1s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear ${hasEntered ? '1s' : '0s'}`
                : 'none' 
          }}
      >
          <div className="absolute top-[10%] md:top-[12%] text-center space-y-3 px-4 pt-16 w-full">
              {/* Title Placeholder to keep spacing for subtext if needed, or just remove title from here */}
              <p className={`text-slate-300 text-lg md:text-xl font-medium transition-all duration-500 delay-200 ${isConfigured ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  정확한 이득 계산을 위해 <span className="text-[var(--color-primary)] font-bold text-xl md:text-2xl decoration-wavy underline decoration-[var(--color-primary)]/30 underline-offset-4">API Key</span>와 <span className="text-[var(--color-primary)] font-bold text-xl md:text-2xl decoration-wavy underline decoration-[var(--color-primary)]/30 underline-offset-4">제작 보너스</span>를 설정해주세요.
              </p>
          </div>
          
          {/* Manual Entry Button */}
          <div className={`absolute bottom-10 md:bottom-24 left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-auto z-[100] ${isConfigured ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
               <button 
                  onClick={() => setHasEntered(true)}
                  className="group relative px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-lg font-black rounded-2xl shadow-2xl hover:shadow-[var(--color-primary)]/50 transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
               >
                   <span className="relative z-10">계산기 시작하기</span>
                   <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                   </svg>
                   <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
               </button>
               <p className="text-center text-[var(--text-secondary)] text-xs mt-4 animate-pulse uppercase tracking-widest font-bold">All Systems Ready</p>
          </div>
      </div>

      {/* Animated Title */}
      <div className={titleClass}>
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-2xl flex items-center gap-2 mb-4">
                <span className="text-[var(--color-primary)]">Lost Ark</span> Material Calculator
            </h1>
            
            {/* View Toggle */}
            <div className={`flex bg-black/40 backdrop-blur-md rounded-full p-1.5 border border-white/10 transition-all duration-500 delay-200 pointer-events-auto ${hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button 
                  onClick={() => setView('calculator')}
                  className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${view === 'calculator' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                  재료 계산기
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${view === 'history' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
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
        ninavBlessing={ninavBlessing}
        setNinavBlessing={setNinavBlessing}
        timeReduction={timeReduction}
        setTimeReduction={setTimeReduction}
        className={bonusClass}
        forceExpanded={!hasEntered}
      />

      <APISettings 
        apiKey={apiKey}
        setApiKey={setApiKey}
        fetchPrices={fetchPrices}
        isLoading={isLoading}
        logs={logs}
        className={apiClass}
        forceExpanded={!hasEntered}
        apiError={apiError}
      />



      <div className={`max-w-5xl w-full relative transition-opacity duration-1000 pt-32 ${isFullyReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
        
        {view === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <header className="mb-6 relative z-10">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('abidos')}
                            className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'abidos' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <span>아비도스</span>
                            {prices.fusion > 0 && <span className="text-[10px] opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded-full">{prices.fusion} G</span>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('superior')}
                            className={`py-2.5 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'superior' ? 'bg-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-secondary)]/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <span>상급 아비도스</span>
                            {prices.superiorFusion > 0 && <span className="text-[10px] opacity-90 font-mono bg-black/20 px-2 py-0.5 rounded-full">{prices.superiorFusion} G</span>}
                        </button>
                    </div>
                </header>

                <MaterialInputs 
                    targetSlots={targetSlots}
                    setTargetSlots={(val) => !isNaN(val) && setTargetSlots(val)}
                    ownedRare={ownedRare}
                    setOwnedRare={(val) => !isNaN(val) && setOwnedRare(val)}
                    ownedUncommon={ownedUncommon}
                    setOwnedUncommon={(val) => !isNaN(val) && setOwnedUncommon(val)}
                    ownedCommon={ownedCommon}
                    setOwnedCommon={(val) => !isNaN(val) && setOwnedCommon(val)}
                    prices={prices}
                    bundleCounts={bundleCounts}
                />

                <div className="pt-5 border-t border-white/5 mt-6">
                    <button 
                        onClick={openPip} 
                        className="w-full py-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:brightness-110 text-white rounded-xl font-bold transition-all shadow-xl shadow-[var(--color-primary)]/20 active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                    >
                        <span>오버레이 실행</span>
                        <svg className="w-4 h-4 opacity-70 group-hover/btn:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2h10a2 2 0 00-2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                    
                    <ProfitDisplay profitStats={profitStats} />
                </div>
            </section>

            <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <div className="flex flex-col gap-6 relative z-10 flex-1">
                    {/* Timer Display - Always Visible */}
                    <div className="flex flex-col gap-3 shrink min-h-0">
                        <CraftingCard
                            type={craftingState.type}
                            isActive={craftingState.isActive}
                            startTime={craftingState.startTime}
                            endTime={craftingState.endTime}
                            batchDuration={craftingState.batchDuration}
                            concurrency={craftingState.concurrency}
                            totalSlots={craftingState.totalSlots}
                        />
                    </div>
                
                    <PurchaseRequirements  
                        activeTab={activeTab}
                        results={results}
                        prices={prices}
                    />
                </div>
            </section>
          </div>
        ) : (
          <HistoryView history={history} onDelete={deleteHistory} />
        )}

      </div>

      {/* Theme Selector - Bottom Right Fixed */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 delay-500 ${hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <ThemeSelector />
      </div>

      {pipWindow && createPortal(
        <div className="container">
             <div className="tab-box">
                <button 
                    className={`tab-btn ${activeTab === 'abidos' ? 'active abidos' : ''}`}
                    onClick={() => setActiveTab('abidos')}
                >
                    아비도스
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'superior' ? 'active superior' : ''}`}
                    onClick={() => setActiveTab('superior')}
                >
                    상급 아비도스
                </button>
            </div>

            <div>
                <label className="label">목표 슬롯</label>
                <div className="input-row">
                    <input type="number" value={targetSlots || ''} onChange={(e) => setTargetSlots(Number(e.target.value) || 0)} />
                </div>
            </div>
            <div>
                <label className="label">보유량</label>
                <div className="input-row" style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                        <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 'bold' }}>희귀</span>
                        {prices.rare > 0 && <span className="price-tag">{prices.rare.toLocaleString()} G</span>}
                    </div>
                    <input type="number" value={ownedRare || ''} onChange={(e) => setOwnedRare(Number(e.target.value) || 0)} />
                </div>
                
                <div className="input-row" style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                        <span style={{ color: '#1eff00', fontSize: 13, fontWeight: 'bold' }}>고급</span>
                        {prices.uncommon > 0 && <span className="price-tag">{prices.uncommon.toLocaleString()} G</span>}
                    </div>
                    <input type="number" value={ownedUncommon || ''} onChange={(e) => setOwnedUncommon(Number(e.target.value) || 0)} />
                </div>
                
                <div className="input-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
                        <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 'bold' }}>일반</span>
                        {prices.common > 0 && <span className="price-tag">{prices.common.toLocaleString()} G</span>}
                    </div>
                    <input type="number" value={ownedCommon || ''} onChange={(e) => setOwnedCommon(Number(e.target.value) || 0)} />
                </div>

            </div>
            <div className="res-box">
                {[
                    { key: 'rare', label: '희귀', color: '#3b82f6' },
                    { key: 'uncommon', label: '고급', color: '#1eff00' },
                    { key: 'common', label: '일반', color: '#ffffff' }
                ].map(({ key, label, color }) => {
                    const data = results[key as keyof Omit<Results, 'totalMissingCost'>] as CalculationResult;
                    if (!data) return null;
                    return (
                        <div key={key} className="res-row">
                            <span style={{ fontSize: 13, fontWeight: 'bold', color }}>{label}</span>
                            <div style={{ textAlign: 'right' }}>
                                {data.buyCount > 0 ? (
                                    <>
                                        <span className="buy-val" style={{ marginRight: 6 }}>{data.buyCount}회</span>
                                        <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 'bold' }}>
                                            ({Math.floor(data.cost).toLocaleString()} G)
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ color: '#475569', fontSize: 14 }}>충분</span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {results.totalMissingCost > 0 && (
                    <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>총 구매 비용</span>
                        <span style={{ fontSize: 16, color: '#fbbf24', fontWeight: 'bold' }}>
                            {Math.floor(results.totalMissingCost).toLocaleString()} G
                        </span>
                    </div>
                )}
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
