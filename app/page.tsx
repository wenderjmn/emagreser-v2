import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-teal-dark">
          EmagreSer <span className="text-teal">v2</span>
        </h1>
        <p className="max-w-md text-neutral-600">
          Fundação da plataforma SaaS: Next.js + Vercel + Supabase. Fase 1 —
          conexão com o banco e autenticação.
        </p>
      </div>

      {user ? (
        <Link
          href="/dashboard"
          className="rounded-lg bg-teal px-6 py-3 font-medium text-white transition hover:bg-teal-dark"
        >
          Ir para o painel
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-lg bg-teal px-6 py-3 font-medium text-white transition hover:bg-teal-dark"
        >
          Entrar
        </Link>
      )}
    </main>
  );
}
