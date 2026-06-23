import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getUserProfile,
  getActiveTurma,
  getCurrentWeekNumber,
  getWeekByNumber,
  getMissionsForWeek,
  getUserMissionsForWeek,
} from "@/lib/supabase/aluno";

export const metadata = { title: "Início | EmagreSer" };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/aluno/entrar");

  const profile = await getUserProfile(user.id);
  if (!profile) redirect("/aluno/onboarding");

  const turma = await getActiveTurma();
  const weekNumber = turma
    ? getCurrentWeekNumber(turma.launch_date)
    : 1;

  const week = await getWeekByNumber(weekNumber);
  const missions = week ? await getMissionsForWeek(week.id) : [];
  const userMissions = week
    ? await getUserMissionsForWeek(user.id, week.id)
    : [];

  const completedIds = new Set(
    userMissions
      .filter((um) => um.status === "completed")
      .map((um) => um.mission_id),
  );

  const requiredMissions = missions.filter((m) => m.required);
  const completedRequired = requiredMissions.filter((m) =>
    completedIds.has(m.id),
  ).length;
  const progressPct =
    requiredMissions.length > 0
      ? Math.round((completedRequired / requiredMissions.length) * 100)
      : 0;

  const xpForCurrentLevel = (profile.current_level - 1) * 500;
  const xpForNextLevel = profile.current_level * 500;
  const xpProgress = profile.total_xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPct = Math.round((xpProgress / xpNeeded) * 100);

  const firstName = profile.full_name?.split(" ")[0] ?? "Aluna";

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm text-neutral-500">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* XP + Level card */}
      <div className="rounded-2xl bg-teal p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Nível {profile.current_level}</p>
            <p className="text-3xl font-bold">{profile.total_xp} XP</p>
          </div>
          <div className="text-right">
            {profile.streak_days > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-2xl">🔥</span>
                <span className="text-xl font-bold">{profile.streak_days}</span>
              </div>
            )}
            <p className="text-xs opacity-70">
              {profile.streak_days > 0
                ? `${profile.streak_days} dia${profile.streak_days > 1 ? "s" : ""} seguidos`
                : "Comece hoje!"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs opacity-70">
            <span>{xpProgress} / {xpNeeded} XP</span>
            <span>Nível {profile.current_level + 1}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(xpPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current week */}
      {week ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                Semana {week.number}
              </p>
              <h2 className="mt-0.5 text-base font-bold text-neutral-900">
                {week.title}
              </h2>
            </div>
            <span className="text-2xl font-bold text-neutral-300">
              {progressPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            {completedRequired} de {requiredMissions.length} missões obrigatórias
          </p>

          <Link
            href="/aluno/missoes"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal/10 py-2.5 text-sm font-semibold text-teal transition hover:bg-teal/20"
          >
            Ver missões da semana →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-neutral-200">
          <p className="text-neutral-500">
            Nenhuma turma ativa no momento. Fique de olho!
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/aluno/diario"
          className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 hover:ring-teal/50"
        >
          <span className="text-2xl">📓</span>
          <span className="text-sm font-semibold text-neutral-900">
            Diário alimentar
          </span>
          <span className="text-xs text-neutral-400">Registre sua refeição</span>
        </Link>

        <Link
          href="/aluno/sabotador"
          className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 hover:ring-teal/50"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-sm font-semibold text-neutral-900">
            Sabotador interno
          </span>
          <span className="text-xs text-neutral-400">Identifique padrões</span>
        </Link>

        <Link
          href="/aluno/teatro"
          className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 hover:ring-teal/50"
        >
          <span className="text-2xl">🎭</span>
          <span className="text-sm font-semibold text-neutral-900">
            Teatro interno
          </span>
          <span className="text-xs text-neutral-400">Pratique respostas</span>
        </Link>

        <Link
          href="/aluno/comunidade"
          className="flex flex-col gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200 hover:ring-teal/50"
        >
          <span className="text-2xl">👥</span>
          <span className="text-sm font-semibold text-neutral-900">
            Comunidade
          </span>
          <span className="text-xs text-neutral-400">Fale com a turma</span>
        </Link>
      </div>
    </div>
  );
}
