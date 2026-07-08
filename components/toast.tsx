"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((next: string) => {
    setMessage(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="animate-toast-in flex items-center gap-2 rounded-xl bg-[#4A3728] px-4 py-3 text-sm text-white shadow-xl">
            <svg
              className="h-4 w-4 shrink-0 text-[#9DB4E0]"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.415l-7.999 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.415L8 12.585l7.29-7.294a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
