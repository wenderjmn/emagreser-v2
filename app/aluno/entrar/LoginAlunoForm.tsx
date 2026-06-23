"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAluno, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-teal py-3 font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export default function LoginAlunoForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAluno,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-neutral-700"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
