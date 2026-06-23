import { createClient } from "./server";

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  behavioral_profile: "A" | "B" | "C" | "D" | null;
  turma_id: string | null;
  onboarding_done: boolean;
  total_xp: number;
  current_level: number;
  streak_days: number;
  streak_record: number;
  joined_at: string;
};

export type Week = {
  id: string;
  number: number;
  title: string;
  theme: string | null;
  unlock_day: number;
  xp_bonus_100pct: number;
  mentor_ira_focus: string | null;
  mentor_dany_focus: string | null;
};

export type Mission = {
  id: string;
  week_id: string | null;
  title: string;
  description: string | null;
  type: "check" | "diary" | "reflection" | "challenge" | "theater" | null;
  xp_reward: number;
  order_index: number;
  required: boolean;
  mentor: string;
};

export type UserMission = {
  mission_id: string;
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  xp_earned: number;
};

export type Mentor = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
  instagram_url: string | null;
  order_index: number;
  active: boolean;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", userId)
    .single();
  return data as UserProfile | null;
}

export async function getActiveTurma() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("turmas")
    .select("id, name, launch_date")
    .eq("active", true)
    .order("launch_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { id: string; name: string; launch_date: string } | null;
}

export function getCurrentWeekNumber(launchDateStr: string): number {
  const launch = new Date(launchDateStr);
  launch.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - launch.getTime()) / 86_400_000) + 1;
  // unlock_day: week 1 = day 1, week 2 = day 8, …, week 12 = day 78
  // find the highest week whose unlock_day <= days (capped at 12)
  const thresholds = [1, 8, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78];
  let week = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (days >= thresholds[i]) week = i + 1;
  }
  return Math.min(week, 12);
}

export async function getWeekByNumber(number: number): Promise<Week | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weeks")
    .select("*")
    .eq("number", number)
    .single();
  return data as Week | null;
}

export async function getAllWeeks(): Promise<Week[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weeks")
    .select("*")
    .order("number");
  return (data ?? []) as Week[];
}

export async function getMissionsForWeek(weekId: string): Promise<Mission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("week_id", weekId)
    .order("order_index");
  return (data ?? []) as Mission[];
}

export async function getUserMissionsForWeek(
  userId: string,
  weekId: string,
): Promise<UserMission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_missions")
    .select("mission_id, status, completed_at, xp_earned")
    .eq("user_id", userId)
    .in(
      "mission_id",
      (
        await supabase
          .from("missions")
          .select("id")
          .eq("week_id", weekId)
      ).data?.map((m: { id: string }) => m.id) ?? [],
    );
  return (data ?? []) as UserMission[];
}

export async function getMentors(): Promise<Mentor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentors")
    .select("*")
    .eq("active", true)
    .order("order_index");
  return (data ?? []) as Mentor[];
}
