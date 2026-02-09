import { useState, useCallback } from 'react';
import { CraftingEntry, COSTS, MaterialType } from '../constants/gameData';
import { MarketPrices, BundleCounts } from './useMarketPrices';

interface UseCraftingHistoryProps {
    prices: MarketPrices;
    bundleCounts: BundleCounts;
    activeTab: MaterialType;
    targetSlots: number;
    costReduction: number | null;
    greatSuccessChance: number | null;
    addLog: (msg: string) => void;
}

export function useCraftingHistory(initialHistory: CraftingEntry[] = []) {
    const [history, setHistory] = useState<CraftingEntry[]>(initialHistory);

    const saveHistory = useCallback((
        activeTab: MaterialType,
        targetSlots: number,
        prices: MarketPrices,
        bundleCounts: BundleCounts,
        costReduction: number | null,
        greatSuccessChance: number | null,
        addLog: (msg: string) => void
    ) => {
        // Calculate Unit Cost based on Standard Recipe (ignoring owned counts)
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
      }, []);

    const deleteHistory = useCallback((id: string) => {
        setHistory(prev => prev.filter(entry => entry.id !== id));
    }, []);

    const clearHistory = useCallback(() => {
        if (confirm('정말 모든 기록을 삭제하시겠습니까?')) {
            setHistory([]);
        }
    }, []);

    const updateHistoryEntry = useCallback((id: string, actualCount: number, prices: MarketPrices, bundleCounts: BundleCounts) => {
        setHistory(prev => prev.map(entry => {
            if (entry.id !== id) return entry;
            
            const fusionKey = entry.type === 'abidos' ? 'fusion' : 'superiorFusion';
            const outputPrice = prices[fusionKey as keyof typeof prices] || 0;
            const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
            const unitPrice = outputBundle > 0 ? (outputPrice / outputBundle) : 0;
            
            const actualRevenue = (actualCount * unitPrice) * 0.95;
            const actualProfit = actualRevenue - entry.totalCost;
            
            return { ...entry, actualOutput: actualCount, actualProfit };
        }));
    }, []);

    const handleRecordResult = useCallback((actualCount: number, prices: MarketPrices, bundleCounts: BundleCounts) => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const latest = prev[0];
            
            const fusionKey = latest.type === 'abidos' ? 'fusion' : 'superiorFusion';
            const outputPrice = prices[fusionKey as keyof typeof prices] || 0;
            const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
            const unitPrice = outputBundle > 0 ? (outputPrice / outputBundle) : 0;
            
            const actualRevenue = (actualCount * unitPrice) * 0.95;
            const actualProfit = actualRevenue - latest.totalCost;
            
            const updated = { ...latest, actualOutput: actualCount, actualProfit };
            return [updated, ...prev.slice(1)];
        });
        alert(`[기록 완료] 실제 결과 ${actualCount}개가 저장되었습니다.`);
    }, []);

    return {
        history,
        setHistory,
        saveHistory,
        deleteHistory,
        clearHistory,
        updateHistoryEntry,
        handleRecordResult
    };
}
