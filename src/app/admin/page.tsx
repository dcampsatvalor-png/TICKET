import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { UsersAdmin } from "@/components/admin/users-admin";
import { isAdmin } from "@/lib/auth/roles";
import { isDemoMode } from "@/lib/env";
import { getCurrentProfile } from "@/lib/tickets/service";
import { listUsers } from "@/lib/users/service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile && !isDemoMode()) {
    redirect("/login");
  }
  if (!isAdmin(profile)) {
    redirect("/tickets");
  }

  const users = await listUsers();

  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} active="admin" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-slate-900">
            Usuarios
          </h1>
          <p className="max-w-2xl text-slate-600">
            Alta de cuentas y asignación de roles. Solo los administradores
            pueden acceder a esta pantalla.
          </p>
        </div>
        <UsersAdmin users={users} currentUserId={profile!.id} />
      </main>
    </div>
  );
}
