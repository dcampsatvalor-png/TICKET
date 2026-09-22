import Link from "next/link";
import { Headset } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { isDemoMode } from "@/lib/env";
import type { Profile } from "@/types/database";

export function AppHeader({
  profile,
  active = "tickets",
}: {
  profile: Profile | null;
  active?: "tickets" | "informes";
}) {
  const demo = isDemoMode();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/tickets" className="flex items-center gap-2.5 group">
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition group-hover:bg-teal-700">
              <Headset className="size-4" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-sm font-semibold tracking-tight text-slate-900">
                SOPORTE IT
              </p>
              <p className="text-[11px] text-slate-500">TASACIONES HIPOTECARIAS</p>
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
              Tickets
            </Link>
            <Link
              href="/informes"
              className={
                active === "informes"
                  ? "rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900"
                  : "rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            >
              Informes
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
