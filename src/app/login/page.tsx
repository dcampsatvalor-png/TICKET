import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Headset } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const demo = isDemoMode();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/70 via-slate-50 to-slate-100"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
            <Headset className="size-6" />
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
            Mesa de Ayuda
          </h1>
          <p className="mt-2 text-slate-600">
            Acceso para agentes de soporte IT
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur">
          {demo ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                Estás en <strong>modo demo</strong>: no hace falta Supabase.
                Entra directamente al panel con datos de ejemplo.
              </p>
              <form action={loginAction}>
                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                  Entrar al panel demo
                </Button>
              </form>
            </div>
          ) : (
            <form action={loginAction} className="space-y-4">
              <input type="hidden" name="next" value={params.next ?? "/tickets"} />
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="agente@empresa.com"
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
                />
              </div>
              {params.error && (
                <p className="text-sm text-red-600" role="alert">
                  {params.error}
                </p>
              )}
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                Iniciar sesión
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/tickets" className="text-teal-700 underline-offset-2 hover:underline">
            Ir a tickets
          </Link>
        </p>
      </div>
    </div>
  );
}
