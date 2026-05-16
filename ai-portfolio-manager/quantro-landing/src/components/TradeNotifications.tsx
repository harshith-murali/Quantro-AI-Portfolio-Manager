"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
  id: string;
  type: "BUY" | "SELL" | "ALERT";
  title: string;
  message: string;
  timestamp: string;
};

let globalDispatch: ((n: Notification) => void) | null = null;

export function notify(notification: Omit<Notification, "id" | "timestamp">) {
  if (globalDispatch) {
    globalDispatch({
      ...notification,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    });
  }
}

export function TradeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dispatch = useCallback((n: Notification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((p) => p.id !== n.id));
    }, 5000);
  }, []);

  useEffect(() => {
    globalDispatch = dispatch;
    return () => { globalDispatch = null; };
  }, [dispatch]);

  const colors = {
    BUY:   { border: "border-emerald-500/30", bg: "bg-emerald-500/10", dot: "bg-emerald-400", label: "text-emerald-400" },
    SELL:  { border: "border-red-500/30",     bg: "bg-red-500/10",     dot: "bg-red-400",     label: "text-red-400"     },
    ALERT: { border: "border-gold/30",        bg: "bg-gold/10",        dot: "bg-gold",        label: "text-gold"        },
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end" role="alert">
      <AnimatePresence>
        {notifications.map((n) => {
          const c = colors[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1     }}
              exit={  { opacity: 0, x: 60,  scale: 0.92 }}
              transition={{ type: "spring", damping: 20 }}
              className={`glass-card max-w-xs w-full border ${c.border} ${c.bg} p-4 rounded-2xl shadow-2xl backdrop-blur-2xl`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${c.dot} animate-pulse`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`text-xs font-bold uppercase tracking-widest ${c.label}`}>{n.type}</p>
                    <p className="text-[10px] text-white/30">{n.timestamp}</p>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{n.title}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
