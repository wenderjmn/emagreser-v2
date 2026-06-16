"use client";

import { useFormState, useFormStatus } from "react-dom";
import { authenticate, type AuthState } from "./actions";

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="space-y-3">
      <button
        type="submit"
        name="intent"
        value="login"
        disabled={pending}
        className="w-full rounded-lg bg-teal px-4 py-2.5 font-medium text-white transition hover:bg-teal-dark disabled:opacity-60"
      >
        {pending ? "Aguarde…" : "Entrar"}
      </button>
      <button
        type="submit"
        name="intent"
        value="signup"
        disabled={pending}
        className="w-full rounded-lg border border-teal px-4 py-2.5 font-medium text-teal transition hover:bg-teal/5 disabled:opacity-60"
      >
        Criar conta
      </button>
    </div>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState<AuthState, FormData>(
    authenticate,
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
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-teal focus:ring-1 focus:ring-teal"
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
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Buttons />
    </form>
  );
}
