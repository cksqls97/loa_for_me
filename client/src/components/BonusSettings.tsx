import React, { useState } from 'react';
import GuideTooltip from './GuideTooltip';

interface BonusSettingsProps {
  costReduction: number | null;
  setCostReduction: (val: number | null) => void;
  greatSuccessChance: number | null;
  setGreatSuccessChance: (val: number | null) => void;
  ninavBlessing: boolean;
  setNinavBlessing: (val: boolean) => void;
  timeReduction: number | null;
  setTimeReduction: (val: number | null) => void;
  className?: string;
  forceExpanded?: boolean;
}

export default function BonusSettings({
  costReduction,
  setCostReduction,
  greatSuccessChance,
  setGreatSuccessChance,
  ninavBlessing,
  setNinavBlessing,
  timeReduction,
  setTimeReduction,
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
          className={`pointer-events-auto px-4 py-2 bg-[var(--bg-panel)] hover:bg-[var(--bg-main)] backdrop-blur-md text-white/80 hover:text-white border border-[var(--border-color)] rounded-lg text-sm font-bold transition-all shadow-lg ${forceExpanded ? 'opacity-50 cursor-default' : ''}`}
      >
          {isOpen ? (forceExpanded ? '필수 설정' : '보너스 설정 닫기') : '제작 보너스 설정'}
      </button>
      
      {isOpen && (
          <div className={`pointer-events-auto mt-3 w-80 bg-[var(--bg-main)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 origin-top-left ${forceExpanded ? 'flex flex-col justify-center min-h-[320px]' : ''}`}>
              <div className="flex flex-col gap-5">
                  
                  {/* Ninav's Blessing */}
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">니나브의 축복 (제작 시간 단축)</label>
                      <button 
                          onClick={() => setNinavBlessing(!ninavBlessing)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border ${ninavBlessing ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}
                      >
                          {ninavBlessing ? '적용 중 (ON)' : '미적용 (OFF)'}
                      </button>
                  </div>

                  {/* Cost Reduction */}
                  <div>
                      <div className="flex items-center mb-2">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">제작 수수료 감소 (%)</label>
                          <GuideTooltip 
                              label="수수료 감소 가이드" 
                              description="영지 내 '로나운의 고서' 메뉴에서 확인 가능한 수수료 감소 효과의 합계를 입력해주세요."
                              imageSrc="/images/guide_ronaun.png"
                              imageAlt="로나운의 고서 예시 이미지"
                          />
                      </div>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={costReduction ?? ''}
                              onChange={(e) => setCostReduction(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-snug break-keep opacity-80">* 대성공 확률도 동일하게 합산하여 입력합니다.</p>
                  </div>

                  {/* Great Success Details */}
                  <div>
                      <div className="flex items-center mb-2">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">대성공 확률 (%)</label>
                      </div>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={greatSuccessChance ?? ''}
                              onChange={(e) => setGreatSuccessChance(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                       <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 opacity-80">* 기본 5% + {greatSuccessChance || 0}% (최종 {(0.05 * (1 + (greatSuccessChance || 0)/100) * 100).toFixed(2)}%)</p>
                  </div>

                  {/* Time Reduction */}
                  <div>
                      <div className="flex items-center mb-2">
                          <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">제작 시간 감소 (%)</label>
                          <GuideTooltip 
                              label="시간 감소 가이드" 
                              description="영지 내 '로나운의 고서'에서 확인 가능한 시간 감소 효과들의 합계를 입력해주세요. (니나브의 축복은 자동으로 +10%p 적용됩니다)"
                              imageSrc="/images/guide_ronaun.png"
                              imageAlt="로나운의 고서 예시 이미지"
                          />
                      </div>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={timeReduction ?? ''}
                              onChange={(e) => setTimeReduction(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-snug break-keep opacity-80">
                          * 최종 감소율: {(timeReduction || 0) + (ninavBlessing ? 10 : 0)}% (입력값 {timeReduction || 0}% + 니나브 {ninavBlessing ? 10 : 0}%)
                      </p>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
}
