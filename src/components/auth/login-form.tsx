"use client";

import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

function LoginSubmitButton({ demo }: { demo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-teal-600 hover:bg-teal-700"
    >
      {pending ? (
        <Spinner
          label={demo ? "Entrando al panel…" : "Iniciando sesión…"}
          className="text-white"
        />
      ) : demo ? (
        "Entrar al panel demo"
      ) : (
        "Iniciar sesión"
      )}
    </Button>
  );
}

function LoginFields({
  next,
  error,
}: {
  next: string;
  error?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="agente@empresa.com"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <LoginSubmitButton demo={false} />
    </>
  );
}

export function LoginForm({
  demo,
  next,
  error,
}: {
  demo: boolean;
  next: string;
  error?: string;
}) {
  if (demo) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Estás en <strong>modo demo</strong>: no hace falta Supabase. Entra
          directamente al panel con datos de ejemplo.
        </p>
        <form action={loginAction}>
          <LoginSubmitButton demo />
        </form>
      </div>
    );
  }

  return (
    <form action={loginAction} className="space-y-4">
      <LoginFields next={next} error={error} />
    </form>
  );
}
