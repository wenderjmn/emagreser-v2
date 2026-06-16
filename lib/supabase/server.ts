import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client para Server Components, Server Actions e Route Handlers.
 * Lê/escreve a sessão nos cookies da request. Usa a chave publishable (anon),
 * portanto respeita RLS pelo usuário autenticado.
 *
 * Para operações que exigem service_role (bypass de RLS — workers, jobs admin),
 * criar um client dedicado com SUPABASE_SERVICE_ROLE_KEY apenas em código server-side.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` chamado de um Server Component — pode ser ignorado se houver
            // um middleware atualizando a sessão (ver middleware.ts).
          }
        },
      },
    },
  );
}
