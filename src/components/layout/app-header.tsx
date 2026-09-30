import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { BrandLogo } from "@/components/brand/logo";
import { isDemoMode } from "@/lib/env";
import type { Profile } from "@/types/database";

export function AppHeader({
  profile,
  active = "tickets",
}: {
  profile: Profile | null;
  active?: "tickets" | "informes" | "desarrollos";
}) {
  const demo = isDemoMode();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/tickets"
            className="flex min-w-0 items-center gap-2.5 group"
            aria-label="SOPORTE IT · Tasaciones Hipotecarias"
          >
            <BrandLogo variant="mark" className="h-7 shrink-0 sm:h-8" priority />
            <div className="min-w-0 leading-tight">
              <p className="font-heading text-sm font-semibold tracking-tight text-slate-900">
                SOPORTE IT
              </p>
              <p className="truncate text-[11px] text-slate-500">
                TASACIONES HIPOTECARIAS
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/tickets"
              className={
                active === "tickets"
                  ? "rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900"
                  : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            >
              Incidencias
            </Link>
            <Link
              href="/desarrollos"
              className={
                active === "desarrollos"
                  ? "rounded-md bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-900"
                  : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            >
              Desarrollos
            </Link>
            <Link
              href="/informes"
              className={
                active === "informes"
                  ? "rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900"
                  : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            >
              Reportes
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {demo && (
            <span className="hidden sm:inline rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
              Modo demo
            </span>
          )}
          {profile && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{profile.full_name}</p>
              <p className="text-[11px] text-slate-500">{profile.email}</p>
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
