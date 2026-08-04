"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = "success",
      duration = 3000
    ) => {
      const id = Date.now() + Math.random();

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message,
          type,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const styles =
            toast.type === "success"
              ? "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
              : toast.type === "error"
                ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                : toast.type === "warning"
                  ? "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100"
                  : "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100";

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 shadow-lg ${styles}`}
            >
              <p className="text-sm font-medium">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-lg leading-none opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider."
    );
  }

  return context;
}