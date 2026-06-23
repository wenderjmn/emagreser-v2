"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string } | null;

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Informe seu nome completo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("users_profile").upsert(
    {
      id: user.id,
      full_name: fullName,
      onboarding_done: true,
      joined_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) return { error: "Não foi possível salvar seu perfil. Tente novamente." };

  revalidatePath("/aluno", "layout");
  redirect("/aluno/home");
}
