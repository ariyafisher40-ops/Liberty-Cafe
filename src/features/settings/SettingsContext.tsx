import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SITE_SETTINGS } from '../../data/demoSeed';
import { getPublicSiteSettings } from '../../services/settings.service';
import type { SiteSettingsMap } from '../../types/domain';

interface SettingsContextValue {
  settings: SiteSettingsMap;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const next = await getPublicSiteSettings();
      setSettings(next);
    } catch {
      // Keep default placeholders if settings fetch fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      refreshSettings,
    }),
    [settings, isLoading, refreshSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside SettingsProvider.');
  }
  return ctx;
}
