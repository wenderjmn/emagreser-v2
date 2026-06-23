"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CompleteMissionResult =
  | { xp_earned: number; badges_awarded: { name: string; emoji: string; xp: number }[] }
  | { error: string };

export async function completeMission(
  missionId: string,
  content?: string,
): Promise<CompleteMissionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada." };

  const { data, error } = await supabase.rpc("complete_mission", {
    p_user_id: user.id,
    p_mission_id: missionId,
    p_content: content ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/aluno", "layout");
  return data as CompleteMissionResult;
}
