import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/aluno";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/aluno/entrar");

  const profile = await getUserProfile(user.id);

  if (!profile || !profile.onboarding_done) {
    redirect("/aluno/onboarding");
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            href="/aluno/home"
            className="text-lg font-bold text-teal"
          >
            🌱 EmagreSer
          </Link>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="font-semibold text-teal">
              {profile.total_xp} XP
            </span>
            <span>·</span>
            <span>
              Nível {profile.current_level}
            </span>
            {profile.streak_days > 0 && (
              <>
                <span>·</span>
                <span>🔥 {profile.streak_days}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg justify-around">
          <NavItem href="/aluno/home" label="Início" icon="🏠" />
          <NavItem href="/aluno/missoes" label="Missões" icon="🎯" />
          <NavItem href="/aluno/diario" label="Diário" icon="📓" />
          <NavItem href="/aluno/comunidade" label="Turma" icon="👥" />
          <NavItem href="/aluno/mentoras" label="Mentoras" icon="⭐" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 px-3 py-2 text-neutral-500 hover:text-teal"
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
