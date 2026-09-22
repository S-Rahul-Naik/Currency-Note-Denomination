import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  DetectionResult,
  UserPreferences,
} from "@/types";
import { DEFAULT_PREFERENCES } from "@/data/defaults";

export interface AppContextValue {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  lastResult: DetectionResult | null;
  setLastResult: (r: DetectionResult | null) => void;
  isDemoUser: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const PREF_KEY = "dd_preferences";

function loadPreferences(): UserPreferences {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PREF_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPreferences>;
        return { ...DEFAULT_PREFERENCES, ...parsed, voice: { ...DEFAULT_PREFERENCES.voice, ...(parsed.voice ?? {}) } };
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }
  return DEFAULT_PREFERENCES;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(loadPreferences);
  const [lastResult, setLastResult] = useState<DetectionResult | null>(null);
  const [isDemoUser] = useState(true);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("high-contrast", preferences.accessibility.highContrast);
    document.body.classList.toggle("large-text", preferences.accessibility.largeText);
    document.documentElement.classList.toggle("dark", preferences.accessibility.darkMode);
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(preferences));
    } catch {
      /* storage may be unavailable */
    }
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      resetPreferences,
      lastResult,
      setLastResult,
      isDemoUser,
    }),
    [
      preferences,
      updatePreferences,
      resetPreferences,
      lastResult,
      isDemoUser,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}