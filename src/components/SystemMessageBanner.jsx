import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { motion } from "framer-motion";

export default function SystemMessageBanner({ messages = [] }) {
  const [dismissed, setDismissed] = React.useState(new Set());

  if (!messages.length) return null;

  const activeMessages = messages.filter(msg => msg.is_active && !dismissed.has(msg.id));
  if (!activeMessages.length) return null;

  const typeConfig = {
    error: { bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
    warning: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
    success: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    info: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", icon: Info, color: "text-blue-600 dark:text-blue-400" },
  };

  return (
    <div className="space-y-2">
      {activeMessages.map((msg, idx) => {
        const config = typeConfig[msg.type] || typeConfig.info;
        const IconComponent = config.icon;
        
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className={`flex items-start gap-3 rounded-lg border p-4 ${config.bg} ${config.border}`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
            <div className="flex-1 min-w-0">
              {msg.title && (
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {msg.title}
                </h3>
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                {msg.message}
              </p>
            </div>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(msg.id))}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}