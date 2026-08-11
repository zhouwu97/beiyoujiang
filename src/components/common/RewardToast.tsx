'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface RewardToastContextValue {
  show: (title: string) => void;
}

const RewardToastContext = createContext<RewardToastContextValue>({ show: () => {} });

export function RewardToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((nextTitle: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTitle(nextTitle);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 1500);
  }, []);

  return (
    <RewardToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center">
          <div className="reward-toast">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[11px] bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">+</div>
            <p className="mt-3 text-[14px] font-bold text-[var(--ink)]">{title}</p>
            <p className="mt-1 text-[11px] font-bold text-[var(--accent)]">+1 U酱币</p>
          </div>
        </div>
      )}
    </RewardToastContext.Provider>
  );
}

export function useRewardToast() {
  return useContext(RewardToastContext);
}
