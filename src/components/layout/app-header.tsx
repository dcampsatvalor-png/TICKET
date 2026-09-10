import Link from "next/link";
import { Headset, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/env";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";

export function AppHeader({ profile }: { profile: Profile | null }) {
  const demo = isDemoMode();

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/tickets" className="flex items-center gap-2.5 group">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm shadow-teal-600/20 transition group-hover:bg-teal-700">
            <Headset className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold tracking-tight text-slate-900">
              Mesa de Ayuda
            </p>
            <p className="text-[11px] text-slate-500">Soporte IT interno</p>
          </div>
        </Link>

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
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
