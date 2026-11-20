const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  '';

function isPlaceholderUrl(value: string): boolean {
  if (!value) return true;
  if (value.includes('your-project-ref')) return true;
  try {
    const parsed = new URL(value);
    return !parsed.protocol.startsWith('http');
  } catch {
    return true;
  }
}

function isPlaceholderKey(value: string): boolean {
  if (!value) return true;
  if (value.includes('your-supabase')) return true;
  return value.length < 20;
}

export const env = {
  supabaseUrl: rawUrl,
  supabaseAnonKey: rawAnonKey,
  siteUrl:
    (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  enableDemoMenuBadge:
    (import.meta.env.VITE_ENABLE_DEMO_MENU_BADGE as string | undefined)?.toLowerCase() === 'true',
  isSupabaseConfigured: !isPlaceholderUrl(rawUrl) && !isPlaceholderKey(rawAnonKey),
};
