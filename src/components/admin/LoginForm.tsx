"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { AlertIcon } from "@/components/icons";

const field =
  "w-full rounded-lg border border-linea-fuerte bg-white px-3.5 py-3 text-[0.9375rem] text-tinta transition-colors placeholder:text-tinta-suave/70 hover:border-marca-300 focus:border-marca-400";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setLoading(false);
      // Deliberately generic: never reveal whether the address exists.
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-tinta">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={field}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-tinta">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={field}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-alerta-suave px-3 py-2.5 text-sm text-alerta"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex min-h-[2.875rem] items-center justify-center rounded-xl bg-marca-400 px-4 text-sm font-semibold text-white transition-colors hover:bg-marca-500 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
