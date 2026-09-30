"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  updateUserRoleAction,
} from "@/app/actions/users";
import type { AppRole, Profile } from "@/types/database";
import { ROLE_LABELS } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function UsersAdmin({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState("Procesando…");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("employee");

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingLabel("Creando usuario…");
    startTransition(async () => {
      const result = await createUserAction({
        fullName,
        email,
        password,
        role,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("employee");
      setSuccess(`Usuario ${result.user.email} creado correctamente.`);
      router.refresh();
    });
  }

  function onRoleChange(userId: string, next: string | null) {
    if (!next || (next !== "admin" && next !== "employee")) return;
    setError(null);
    setSuccess(null);
    setPendingLabel("Actualizando rol…");
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Rol actualizado: ${ROLE_LABELS[result.user.role]}.`);
      router.refresh();
    });
  }

  return (
    <div className="relative space-y-8">
      {pending && <LoadingOverlay label={pendingLabel} />}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-heading text-lg font-semibold text-slate-900">
          Crear usuario
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          El administrador da de alta cuentas con acceso al panel. El empleado
          puede gestionar incidencias y desarrollos; el administrador también
          gestiona usuarios.
        </p>

        <form onSubmit={onCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={pending}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
              placeholder="usuario@empresa.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={pending}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2 sm:max-w-xs">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v === "admin" || v === "employee") setRole(v);
              }}
              disabled={pending}
            >
              <SelectTrigger id="role" className="w-full bg-white">
                <SelectValue>
                  {(value: AppRole | null) =>
                    value ? ROLE_LABELS[value] : "Seleccionar"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
                <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-600 sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-teal-700 sm:col-span-2" role="status">
              {success}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner label="Creando…" /> : "Crear usuario"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold text-slate-900">
          Usuarios del panel
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-medium">Nombre</th>
                <th className="pb-2 pr-3 font-medium">Correo</th>
                <th className="pb-2 font-medium">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-3 pr-3 font-medium text-slate-800">
                    {user.full_name}
                    {user.id === currentUserId ? (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        (tú)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{user.email}</td>
                  <td className="py-3">
                    <Select
                      value={user.role}
                      onValueChange={(v) => onRoleChange(user.id, v)}
                      disabled={pending}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-44 bg-white",
                          user.role === "admin" && "border-teal-200"
                        )}
                      >
                        <SelectValue>
                          {(value: AppRole | null) =>
                            value ? ROLE_LABELS[value] : "—"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          {ROLE_LABELS.employee}
                        </SelectItem>
                        <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
