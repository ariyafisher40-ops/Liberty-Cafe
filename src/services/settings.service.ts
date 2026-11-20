import { DEFAULT_SITE_SETTINGS } from '../data/demoSeed';
import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { SiteSettingsMap } from '../types/domain';
import { previewStore } from './previewStore';

export async function getPublicSiteSettings(): Promise<SiteSettingsMap> {
  if (!env.isSupabaseConfigured || !supabase) {
    return previewStore.getState().settings;
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .eq('is_public', true);

  if (error) {
    throw new Error('Unable to load site settings.');
  }

  const merged = structuredClone(DEFAULT_SITE_SETTINGS);
  for (const row of data ?? []) {
    const key = row.key as keyof SiteSettingsMap;
    if (key in merged && row.value !== null && row.value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (merged as any)[key] = row.value;
    }
  }
  return merged;
}

export async function updateSiteSettings(
  nextSettings: SiteSettingsMap
): Promise<SiteSettingsMap> {
  if (!env.isSupabaseConfigured || !supabase) {
    previewStore.updateState((s) => ({
      ...s,
      settings: nextSettings,
    }));
    return nextSettings;
  }

  const entries = Object.entries(nextSettings).map(([key, value]) => ({
    key,
    value,
    is_public: true,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('site_settings')
    .upsert(entries, { onConflict: 'key' });

  if (error) {
    throw new Error('Failed to save site settings.');
  }

  return nextSettings;
}
