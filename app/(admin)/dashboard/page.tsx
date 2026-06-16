import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export const metadata = {
  title: "Painel — EmagreSer v2",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade: o middleware já protege, mas validamos no servidor.
  if (!user) {
    redirect("/login");
  }

  // Validação end-to-end da conexão com o banco existente (v1).
  // `leads` tem RLS — sob a chave anon o count pode vir restrito; tratamos ambos os casos.
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-teal-dark">Painel</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Sair
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Sessão
        </h2>
        <p className="mt-2 text-neutral-800">
          Autenticado como <strong>{user.email}</strong>
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Conexão Supabase (tabela <code>leads</code>)
        </h2>
        {error ? (
          <p className="mt-2 text-sm text-amber-700">
            Conectado, mas o SELECT em <code>leads</code> foi bloqueado por RLS
            ({error.message}). Isso é esperado com a chave anon — confirma que a
            conexão e as policies estão ativas.
          </p>
        ) : (
          <p className="mt-2 text-neutral-800">
            Conexão OK — <strong>{count ?? 0}</strong> leads visíveis para a
            sessão atual.
          </p>
        )}
      </section>
    </main>
  );
}
