import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client para uso em Client Components (browser).
 * Usa a chave publishable (anon) — segura para exposição no front-end.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
