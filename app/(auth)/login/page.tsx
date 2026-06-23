import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Entrar — EmagreSer v2",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-2xl font-bold text-teal-dark">
            EmagreSer <span className="text-teal">v2</span>
          </Link>
          <p className="text-sm text-neutral-500">
            Acesse o painel da plataforma.
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
