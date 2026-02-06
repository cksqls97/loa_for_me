"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

type MaterialType = 'abidos' | 'superior';

const COSTS: Record<MaterialType, { rare: number, uncommon: number, common: number }> = {
  abidos: { rare: 33, uncommon: 45, common: 86 },
  superior: { rare: 43, uncommon: 59, common: 112 }
};

interface CalculationResult {
  buyCount: number;
  needed: number;
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
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const data = { targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab };
    localStorage.setItem('matCalcData', JSON.stringify(data));
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab]);

  const results: Results = useMemo(() => {
    const slots = Math.max(0, targetSlots);
    const owned = { rare: ownedRare, uncommon: ownedUncommon, common: ownedCommon };
    const res: any = {};
    const currentCost = COSTS[activeTab];
    
    (Object.keys(currentCost) as Array<keyof typeof currentCost>).forEach((key) => {
      const needed = currentCost[key] * slots;
      const deficit = needed - owned[key];
      const buyCount = deficit <= 0 ? 0 : Math.ceil(deficit / 100);
      res[key] = { buyCount, needed };
    });
    return res as Results;
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab]);

  const handleUpdate = () => {
     setOwnedRare(prev => (prev + results.rare.buyCount * 100) - results.rare.needed);
     setOwnedUncommon(prev => (prev + results.uncommon.buyCount * 100) - results.uncommon.needed);
     setOwnedCommon(prev => (prev + results.common.buyCount * 100) - results.common.needed);
  };

  const openPip = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert("PiP 미지원");
      return;
    }
    try {
      // @ts-ignore
      const win = await window.documentPictureInPicture.requestWindow({ width: 340, height: 600 });
      setPipWindow(win);

      // Copy styles
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; }
        body { background: #0f111a; color: white; font-family: 'Pretendard', sans-serif; padding: 12px 10px; margin: 0; overflow: hidden; }
        .container { display: flex; flex-direction: column; gap: 10px; }
        .tab-box { display: flex; background: #1a1d29; border-radius: 8px; padding: 2px; margin-bottom: 5px; }
        .tab-btn { flex: 1; padding: 6px; border: none; background: transparent; color: #64748b; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 6px; }
        .tab-btn.active { background: #334155; color: white; }
        .label { font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 3px; display: block; }
        .input-row { display: flex; align-items: center; background: #1a1d29; border-radius: 8px; padding: 6px 12px; }
        .input-row span { font-size: 12px; font-weight: bold; width: 45px; }
        input { background: transparent; border: none; color: white; text-align: right; font-weight: 900; width: 100%; outline: none; font-size: 18px; }
        .res-box { margin-top: 5px; padding-top: 12px; border-top: 1px solid #334155; display: flex; flex-direction: column; gap: 6px; }
        .res-row { display: flex; justify-content: space-between; align-items: center; }
        .buy-val { color: #fbbf24; font-weight: 900; font-size: 24px; }
        .update-btn { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; margin-top: 10px; cursor: pointer; }
        .update-btn:active { background: #1d4ed8; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
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
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
            <header className="mb-6">
                <h1 className="text-2xl font-black tracking-tight text-white mb-4">재료 계산 및 저장</h1>
                
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setActiveTab('abidos')}
                        className={`py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'abidos' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        아비도스
                    </button>
                    <button 
                        onClick={() => setActiveTab('superior')}
                        className={`py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'superior' ? 'bg-blue-600/80 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        상급 아비도스
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">목표 제작 슬롯</label>
                    <input 
                        type="number" 
                        value={targetSlots} 
                        onChange={(e) => setTargetSlots(Number(e.target.value))}
                        min="1" 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-2xl font-black text-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">현재 보유량</label>
                    <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="w-12 text-sm font-bold text-[#3b82f6]">희귀</span>
                        <input 
                            type="number" 
                            value={ownedRare} 
                            onChange={(e) => setOwnedRare(Number(e.target.value))}
                            className="flex-1 bg-transparent text-right font-black text-xl outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="w-12 text-sm font-bold text-[#1eff00]">고급</span>
                        <input 
                            type="number" 
                            value={ownedUncommon} 
                            onChange={(e) => setOwnedUncommon(Number(e.target.value))}
                            className="flex-1 bg-transparent text-right font-black text-xl outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="w-12 text-sm font-bold text-white">일반</span>
                        <input 
                            type="number" 
                            value={ownedCommon} 
                            onChange={(e) => setOwnedCommon(Number(e.target.value))}
                            className="flex-1 bg-transparent text-right font-black text-xl outline-none"
                        />
                    </div>
                </div>

                <button 
                  onClick={openPip} 
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-sm mt-4 cursor-pointer"
                >
                    오버레이 실행 (PiP)
                </button>
            </div>
        </section>

        <section className="bg-blue-600/5 border border-blue-500/10 rounded-[2rem] p-8 flex flex-col">
            <h2 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-8">
                구매 필요 횟수 ({activeTab === 'abidos' ? '아비도스' : '상급 아비도스'})
            </h2>
            <div className="space-y-8 flex-1">
              {[
                { key: 'rare', label: '희귀 재료', color: '#3b82f6' },
                { key: 'uncommon', label: '고급 재료', color: '#1eff00' },
                { key: 'common', label: '일반 재료', color: '#ffffff' }
              ].map(({ key, label, color }) => {
                 const data = results[key as keyof Results];
                 return (
                    <div key={key} className="flex justify-between items-center border-b border-white/5 pb-6">
                        <span className="text-lg font-bold" style={{ color }}>{label}</span>
                        <div className={`text-4xl font-black ${data.buyCount > 0 ? 'text-amber-400' : 'text-slate-700'}`}>
                            {data.buyCount} <span className="text-sm font-normal text-slate-500 ml-1">회</span>
                        </div>
                    </div>
                 );
              })}
            </div>
        </section>
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
                <div className="input-row" style={{ marginBottom: 4 }}>
                    <span style={{ color: '#1eff00' }}>고급</span>
                    <input type="number" value={ownedUncommon} onChange={(e) => setOwnedUncommon(Number(e.target.value))} />
                </div>
                <div className="input-row">
                    <span style={{ color: '#ffffff' }}>일반</span>
                    <input type="number" value={ownedCommon} onChange={(e) => setOwnedCommon(Number(e.target.value))} />
                </div>
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
            <button className="update-btn" onClick={handleUpdate}>제작 완료 (보유량 업데이트)</button>
        </div>,
        pipWindow.document.body
      )}
    </>
  );
}
