import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Atualiza a sessão do Supabase a cada request e protege rotas privadas.
 * Padrão recomendado pelo @supabase/ssr: revalida o token e repassa os cookies
 * atualizados tanto para a request quanto para a response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não rodar código entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAdminAuth = pathname.startsWith("/login");
  const isAlunoPublic = pathname === "/aluno/entrar";
  const isAdminProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAlunoProtected =
    pathname.startsWith("/aluno") && !isAlunoPublic;

  function redirectWith(to: string, searchParams?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    if (searchParams) {
      for (const [k, v] of Object.entries(searchParams)) {
        url.searchParams.set(k, v);
      }
    }
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  if (!user && isAdminProtected)
    return redirectWith("/login", { redirect: pathname });

  if (!user && isAlunoProtected)
    return redirectWith("/aluno/entrar", { redirect: pathname });

  // Usuário autenticado tentando acessar login do admin → dashboard.
  if (user && isAdminAuth)
    return redirectWith("/dashboard");

  return supabaseResponse;
}
