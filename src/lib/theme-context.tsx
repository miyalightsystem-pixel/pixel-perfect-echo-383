import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "empire" | "cyber" | "cinematic";

export const THEMES: { value: ThemeName; label: string; description: string }[] = [
  { value: "empire", label: "Jeruk's Empire", description: "Krim + jingga klasik" },
  { value: "cyber", label: "Cyber Orange", description: "Gelap + glow jingga" },
  { value: "cinematic", label: "Cinematic Dark", description: "Hitam ala Netflix" },
];

type Ctx = { theme: ThemeName; setTheme: (t: ThemeName) => void };
const ThemeCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "empire-theme";
const CLASSES = ["theme-empire", "theme-cyber", "theme-cinematic"];

function applyTheme(t: ThemeName) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  CLASSES.forEach((c) => el.classList.remove(c));
  el.classList.add(`theme-${t}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("empire");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as ThemeName)) || "empire";
    const valid: ThemeName = stored === "cyber" || stored === "cinematic" || stored === "empire" ? stored : "empire";
    setThemeState(valid);
    applyTheme(valid);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
