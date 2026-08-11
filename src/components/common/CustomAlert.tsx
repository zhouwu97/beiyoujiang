'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface CustomAlertContextValue {
  show: (message: string) => void;
}

const CustomAlertContext = createContext<CustomAlertContextValue>({ show: () => {} });

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((nextMessage: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(nextMessage);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  return (
    <CustomAlertContext.Provider value={{ show }}>
      {children}
      <div className="toast-shell" data-visible={visible} role="status" aria-live="polite">
        {message}
      </div>
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  return useContext(CustomAlertContext);
}
