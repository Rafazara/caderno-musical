"use client";

import * as React from "react";
export type ThemePreference = "light" | "dark" | "system";
type ThemeValue = { preference: ThemePreference; setPreference: (value: ThemePreference) => void };
const ThemeContext = React.createContext<ThemeValue>({ preference: "system", setPreference: () => undefined });
const KEY = "caderno-musical:theme";

function apply(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setState] = React.useState<ThemePreference>("system");
  React.useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark" || saved === "system") queueMicrotask(() => setState(saved));
  }, []);
  React.useEffect(() => {
    const saved = localStorage.getItem(KEY);
    apply(saved === "light" || saved === "dark" || saved === "system" ? saved : preference);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => { if (preference === "system") apply("system"); };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [preference]);
  function setPreference(value: ThemePreference) { localStorage.setItem(KEY, value); setState(value); apply(value); }
  return <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { return React.useContext(ThemeContext); }

export const THEME_BOOTSTRAP = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()`;
