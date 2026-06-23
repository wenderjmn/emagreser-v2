import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getUserProfile,
  getActiveTurma,
  getCurrentWeekNumber,
  getAllWeeks,
  getMissionsForWeek,
  getUserMissionsForWeek,
} from "@/lib/supabase/aluno";
import MissionCard from "./MissionCard";

export const metadata = { title: "Missões | EmagreSer" };

export default async function MissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/aluno/entrar");

  const profile = await getUserProfile(user.id);
  if (!profile) redirect("/aluno/onboarding");

  const turma = await getActiveTurma();
  const currentWeekNum = turma ? getCurrentWeekNumber(turma.launch_date) : 1;

  const { semana } = await searchParams;
  const selectedWeekNum = semana
    ? Math.min(Math.max(parseInt(semana, 10) || currentWeekNum, 1), currentWeekNum)
    : currentWeekNum;

  const allWeeks = await getAllWeeks();
  const selectedWeek = allWeeks.find((w) => w.number === selectedWeekNum);

  const missions = selectedWeek ? await getMissionsForWeek(selectedWeek.id) : [];
  const userMissions = selectedWeek
    ? await getUserMissionsForWeek(user.id, selectedWeek.id)
    : [];

  const userMissionMap = new Map(
    userMissions.map((um) => [um.mission_id, um]),
  );

  const completedCount = missions.filter(
    (m) => userMissionMap.get(m.id)?.status === "completed",
  ).length;

  const requiredCount = missions.filter((m) => m.required).length;
  const completedRequired = missions.filter(
    (m) => m.required && userMissionMap.get(m.id)?.status === "completed",
  ).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Missões</h1>
        <p className="text-sm text-neutral-500">
          {completedCount} de {missions.length} concluídas
        </p>
      </div>

      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {allWeeks
          .filter((w) => w.number <= currentWeekNum)
          .map((w) => (
            <a
              key={w.id}
              href={`/aluno/missoes?semana=${w.number}`}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                w.number === selectedWeekNum
                  ? "bg-teal text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:ring-teal/50"
              }`}
            >
              S{w.number}
            </a>
          ))}
      </div>

      {/* Week header */}
      {selectedWeek && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            Semana {selectedWeek.number}
          </p>
          <h2 className="mt-0.5 font-bold text-neutral-900">
            {selectedWeek.title}
          </h2>
          {selectedWeek.theme && (
            <p className="mt-1 text-sm text-neutral-500">{selectedWeek.theme}</p>
          )}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-neutral-400">
              <span>Progresso obrigatório</span>
              <span>
                {completedRequired}/{requiredCount}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-teal transition-all"
                style={{
                  width: `${requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mission list */}
      <div className="space-y-3">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            userMission={userMissionMap.get(mission.id)}
          />
        ))}

        {missions.length === 0 && (
          <p className="py-8 text-center text-neutral-400">
            Nenhuma missão encontrada para esta semana.
          </p>
        )}
      </div>
    </div>
  );
}
