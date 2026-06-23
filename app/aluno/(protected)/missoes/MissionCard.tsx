"use client";

import { useTransition, useState } from "react";
import { completeMission } from "./actions";
import type { Mission, UserMission } from "@/lib/supabase/aluno";

const TYPE_ICON: Record<string, string> = {
  check: "✅",
  diary: "📓",
  reflection: "💭",
  challenge: "🏆",
  theater: "🎭",
};

export default function MissionCard({
  mission,
  userMission,
}: {
  mission: Mission;
  userMission?: UserMission;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    badges?: { name: string; emoji: string }[];
  } | null>(null);

  const completed = userMission?.status === "completed";

  function handleComplete() {
    startTransition(async () => {
      const res = await completeMission(mission.id);
      if ("xp_earned" in res && res.badges_awarded.length > 0) {
        setResult({ badges: res.badges_awarded });
        setTimeout(() => setResult(null), 4000);
      }
    });
  }

  return (
    <div
      className={`rounded-2xl p-4 ring-1 transition ${
        completed
          ? "bg-teal/5 ring-teal/20"
          : "bg-white ring-neutral-200 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl leading-none">
          {TYPE_ICON[mission.type ?? "check"] ?? "✅"}
        </span>

        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold ${
              completed ? "text-teal" : "text-neutral-900"
            }`}
          >
            {completed && "✓ "}
            {mission.title}
          </p>
          {mission.description && (
            <p className="mt-1 text-sm text-neutral-500 leading-snug">
              {mission.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
            <span>+{mission.xp_reward} XP</span>
            {!mission.required && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                opcional
              </span>
            )}
          </div>

          {/* Badge flash */}
          {result?.badges && result.badges.length > 0 && (
            <div className="mt-2 animate-bounce text-sm font-semibold text-amber-600">
              {result.badges.map((b) => (
                <span key={b.name}>
                  {b.emoji} {b.name} desbloqueado!{" "}
                </span>
              ))}
            </div>
          )}
        </div>

        {!completed && (
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="ml-2 shrink-0 rounded-xl bg-teal px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-dark disabled:opacity-50"
          >
            {isPending ? "…" : "Concluir"}
          </button>
        )}
      </div>
    </div>
  );
}
