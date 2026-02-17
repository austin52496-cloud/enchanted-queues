import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: themeConfigs.enchanted, activeTheme: "enchanted", themeConfigs };
  }
  return context;
}

const themeConfigs = {
  enchanted: {
    name: "Enchanted",
    primary: "violet",
    secondary: "fuchsia",
    accent: "pink",
    bgGradient: "from-violet-950 via-violet-900 to-indigo-900",
    button: "bg-violet-600 hover:bg-violet-700",
    buttonOutline: "border-violet-200 text-violet-700 hover:bg-violet-50",
    card: "bg-white dark:bg-slate-800",
    text: "text-slate-900 dark:text-white",
  },
  cosmic: {
    name: "Cosmic",
    primary: "indigo",
    secondary: "purple",
    accent: "blue",
    bgGradient: "from-indigo-950 via-purple-900 to-blue-900",
    button: "bg-indigo-600 hover:bg-indigo-700",
    buttonOutline: "border-indigo-200 text-indigo-700 hover:bg-indigo-50",
    card: "bg-white dark:bg-slate-800",
    text: "text-slate-900 dark:text-white",
  },
  ocean: {
    name: "Ocean",
    primary: "cyan",
    secondary: "blue",
    accent: "teal",
    bgGradient: "from-cyan-950 via-blue-900 to-teal-900",
    button: "bg-cyan-600 hover:bg-cyan-700",
    buttonOutline: "border-cyan-200 text-cyan-700 hover:bg-cyan-50",
    card: "bg-white dark:bg-slate-800",
    text: "text-slate-900 dark:text-white",
  },
  forest: {
    name: "Forest",
    primary: "emerald",
    secondary: "green",
    accent: "teal",
    bgGradient: "from-emerald-950 via-green-900 to-teal-900",
    button: "bg-emerald-600 hover:bg-emerald-700",
    buttonOutline: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    card: "bg-white dark:bg-slate-800",
    text: "text-slate-900 dark:text-white",
  },
  sunset: {
    name: "Sunset",
    primary: "orange",
    secondary: "red",
    accent: "amber",
    bgGradient: "from-orange-950 via-red-900 to-amber-900",
    button: "bg-orange-600 hover:bg-orange-700",
    buttonOutline: "border-orange-200 text-orange-700 hover:bg-orange-50",
    card: "bg-white dark:bg-slate-800",
    text: "text-slate-900 dark:text-white",
  },
};

export function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState("enchanted");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (user?.preferences?.appTheme) {
      setActiveTheme(user.preferences.appTheme);
    }
  }, [user?.preferences?.appTheme]);

  const theme = themeConfigs[activeTheme] || themeConfigs.enchanted;

  return (
    <ThemeContext.Provider value={{ theme, activeTheme, themeConfigs }}>
      {children}
    </ThemeContext.Provider>
  );
}