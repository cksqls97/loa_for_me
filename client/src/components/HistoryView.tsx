import React, { useState, useMemo } from 'react';

interface CraftingEntry {
  id: string;
  timestamp: number;
  type: 'abidos' | 'superior';
  unitCost: number;
  totalCost: number;
  expectedOutput: number;
  expectedProfit: number;
}

interface HistoryViewProps {
  history: CraftingEntry[];
  onDelete: (id: string) => void;
  onClear?: () => void;
}

export default function HistoryView({ history, onDelete, onClear }: HistoryViewProps) {
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'abidos' | 'superior'>('all');

  const filteredHistory = useMemo(() => {
    let data = [...history];

    // Filter
    if (filterType !== 'all') {
        data = data.filter(entry => entry.type === (filterType === 'superior' ? 'superior' : 'abidos'));
    }

    // Sort
    data.sort((a, b) => {
        return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return data;
  }, [history, filterType, sortOrder]);

  const totalProfit = useMemo(() => {
    return filteredHistory.reduce((sum, entry) => sum + (entry.expectedProfit || 0), 0);
  }, [filteredHistory]);

  return (
    <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-[2rem] p-6 shadow-2xl min-h-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-[var(--color-primary)] rounded-full"/>
              제작 기록
              <span className="text-xs font-normal text-[var(--text-secondary)] ml-2">
                  {history.length}개의 기록
              </span>
          </h2>
          
          <div className="flex items-center gap-2">
              {/* Filter Toggle */}
              <div className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)]">
                  <button 
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[var(--text-secondary)] text-[var(--bg-main)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      전체
                  </button>
                  <button 
                      onClick={() => setFilterType('abidos')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${filterType === 'abidos' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      아비도스
                  </button>
                  <button 
                      onClick={() => setFilterType('superior')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${filterType === 'superior' ? 'bg-[var(--color-secondary)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      상급
                  </button>
              </div>

              {/* Sort Toggle */}
              <button 
                  onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
              >
                  <span>{sortOrder === 'newest' ? '최신순' : '오래된순'}</span>
                  <svg className={`w-3 h-3 transition-transform ${sortOrder === 'newest' ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </button>

              {history.length > 0 && (
                  <>
                    {onClear && (
                        <button 
                            onClick={onClear}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mr-2"
                        >
                            모두 삭제
                        </button>
                    )}
                    <button 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDeleteMode ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {isDeleteMode ? '완료' : '편집'}
                    </button>
                  </>
              )}
          </div>
        </div>
        
        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse border border-[var(--border-color)]">
                  <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold whitespace-nowrap">
                      <tr>
                          <th className="border border-[var(--border-color)] px-3 py-2">시간</th>
                          <th className="border border-[var(--border-color)] px-3 py-2">종류</th>
                          <th className="border border-[var(--border-color)] px-3 py-2 text-right">단가</th>
                          <th className="border border-[var(--border-color)] px-3 py-2 text-right">총 비용</th>
                          <th className="border border-[var(--border-color)] px-3 py-2 text-right">예상 결과</th>
                          <th className="border border-[var(--border-color)] px-3 py-2 text-right">예상 수익</th>
                          {isDeleteMode && <th className="border border-[var(--border-color)] px-3 py-2 text-center w-[50px] bg-[var(--color-danger)]/20 text-red-200">삭제</th>}
                      </tr>
                  </thead>
                  <tbody>
                      {filteredHistory.map((entry) => (
                          <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                              <td className="border border-[var(--border-color)] px-3 py-2 text-[var(--text-secondary)] font-mono text-xs whitespace-nowrap">
                                  {new Date(entry.timestamp).toLocaleString()}
                              </td>
                              <td className="border border-[var(--border-color)] px-3 py-2 whitespace-nowrap">
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${entry.type === 'abidos' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'}`}>
                                      {entry.type === 'abidos' ? '아비도스' : '상급 아비도스'}
                                  </span>
                              </td>
                              <td className="border border-[var(--border-color)] px-3 py-2 text-right font-bold text-[var(--color-primary)] whitespace-nowrap">
                                  {Math.floor(entry.unitCost).toLocaleString()} G
                              </td>
                              <td className="border border-[var(--border-color)] px-3 py-2 text-right text-[var(--text-primary)] whitespace-nowrap">
                                  {Math.floor(entry.totalCost).toLocaleString()} G
                              </td>
                              <td className="border border-[var(--border-color)] px-3 py-2 text-right text-[var(--text-primary)] whitespace-nowrap">
                                  {Math.floor(entry.expectedOutput).toLocaleString()} 개
                              </td>
                              <td className={`border border-[var(--border-color)] px-3 py-2 text-right font-bold whitespace-nowrap ${entry.expectedProfit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                                  {entry.expectedProfit > 0 ? '+' : ''}{Math.floor(entry.expectedProfit || 0).toLocaleString()} G
                              </td>
                              {isDeleteMode && (
                                  <td className="border border-[var(--border-color)] px-3 py-2 text-center bg-[var(--color-danger)]/10">
                                      <button 
                                          onClick={() => onDelete(entry.id)}
                                          className="text-white bg-[var(--color-danger)] hover:brightness-110 transition-colors w-6 h-6 rounded flex items-center justify-center mx-auto"
                                          title="삭제"
                                      >
                                          ✕
                                      </button>
                                  </td>
                              )}
                          </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-[var(--bg-main)] font-bold">
                      <tr>
                          <td colSpan={5} className="border border-[var(--border-color)] px-3 py-3 text-right text-[var(--text-secondary)]">
                              총 예상 수익 합계
                          </td>
                          <td className={`border border-[var(--border-color)] px-3 py-3 text-right text-lg ${totalProfit >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                              {totalProfit > 0 ? '+' : ''}{Math.floor(totalProfit).toLocaleString()} G
                          </td>
                          {isDeleteMode && <td className="border border-[var(--border-color)] bg-[var(--bg-main)]"></td>}
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
  );
}
