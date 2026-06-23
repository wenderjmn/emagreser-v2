"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | { error: string }
  | { message: string }
  | null;

export async function authenticate(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const intent = String(formData.get("intent") ?? "login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();

  if (intent === "signup") {
    if (password.length < 6) {
      return { error: "A senha deve ter ao menos 6 caracteres." };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: "Não foi possível criar a conta. Tente outro e-mail." };
    }
    // Confirmação de e-mail ativa: ainda não há sessão.
    if (!data.session) {
      return {
        message:
          "Conta criada! Verifique seu e-mail para confirmar antes de entrar.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: "Credenciais inválidas. Verifique e-mail e senha." };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
