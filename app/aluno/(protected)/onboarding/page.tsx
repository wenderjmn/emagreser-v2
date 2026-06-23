import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export const metadata = { title: "Bem-vinda | EmagreSer" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/aluno/entrar");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-5xl">🎉</span>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900">
            Bem-vinda ao EmagreSer!
          </h1>
          <p className="mt-2 text-neutral-500">
            Você está dando um passo incrível. Vamos começar?
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <OnboardingForm />
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400">
          12 semanas · 61 missões · Transformação de verdade
        </p>
      </div>
    </div>
  );
}
