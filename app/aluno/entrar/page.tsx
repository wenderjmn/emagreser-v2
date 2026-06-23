import LoginAlunoForm from "./LoginAlunoForm";

export const metadata = { title: "Área do Aluno — Entrar | EmagreSer" };

export default function EntrarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">🌱</span>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">
            Área do Aluno
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            EmagreSer — Programa de 12 semanas
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
          <LoginAlunoForm />
        </div>
      </div>
    </div>
  );
}
