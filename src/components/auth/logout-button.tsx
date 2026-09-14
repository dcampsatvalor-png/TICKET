"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="gap-1.5 text-slate-600"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <LogOut className="size-3.5" />
      )}
      <span className="hidden sm:inline">{pending ? "Saliendo…" : "Salir"}</span>
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmit />
    </form>
  );
}
