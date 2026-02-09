import { useState, useCallback } from 'react';

export function usePipWindow() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const openPip = useCallback(async (activeTab: string, setActiveTab: (tab: any) => void) => {
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
  }, []);

  const closePip = useCallback(() => {
      if (pipWindow) {
          pipWindow.close();
          setPipWindow(null);
      }
  }, [pipWindow]);

  return { pipWindow, openPip, closePip };
}
