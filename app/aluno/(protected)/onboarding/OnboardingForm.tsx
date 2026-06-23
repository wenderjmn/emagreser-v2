"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeOnboarding, type OnboardingState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-teal py-3 font-semibold text-white transition hover:bg-teal-dark disabled:opacity-60"
    >
      {pending ? "Salvando…" : "Começar minha jornada →"}
    </button>
  );
}

export default function OnboardingForm() {
  const [state, formAction] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-neutral-700"
        >
          Como você quer ser chamada?
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoFocus
          required
          placeholder="Seu nome"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
        <p className="text-xs text-neutral-400">
          Esse nome vai aparecer para você e para a sua turma.
        </p>
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
