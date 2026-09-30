import { isAdmin, normalizeRole } from "@/lib/auth/roles";
import {
  createDemoUser,
  getDemoAgents,
  updateDemoUserRole,
} from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/tickets/service";
import type { AppRole, Profile } from "@/types/database";

function asProfile(row: Record<string, unknown> | Profile): Profile {
  const r = row as Profile & { role?: unknown };
  return {
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    role: normalizeRole(r.role),
    created_at: r.created_at,
  };
}

async function requireAdminProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile)) {
    throw new Error("Solo un administrador puede gestionar usuarios.");
  }
  return profile;
}

export async function listUsers(): Promise<Profile[]> {
  await requireAdminProfile();
  if (isDemoMode()) return getDemoAgents();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return ((data ?? []) as Profile[]).map((p) => asProfile(p));
}

export async function createUserAccount(input: {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
}): Promise<{ ok: true; user: Profile } | { ok: false; error: string }> {
  try {
    await requireAdminProfile();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No autorizado.",
    };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role = normalizeRole(input.role);

  if (!fullName) return { ok: false, error: "El nombre es obligatorio." };
  if (!email.includes("@")) return { ok: false, error: "Correo no válido." };
  if (password.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (isDemoMode()) {
    const existing = getDemoAgents().find((p) => p.email === email);
    if (existing) return { ok: false, error: "Ya existe un usuario con ese correo." };
    const user = createDemoUser({ fullName, email, role });
    return { ok: true, user };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message ?? "No se pudo crear el usuario.",
    };
  }

  // Ensure profile row has the intended role (trigger may have run).
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    })
    .select("*")
    .single();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true, user: asProfile(profile as Profile) };
}

export async function setUserRole(
  userId: string,
  role: AppRole
): Promise<{ ok: true; user: Profile } | { ok: false; error: string }> {
  try {
    const admin = await requireAdminProfile();
    if (admin.id === userId && role !== "admin") {
      return {
        ok: false,
        error: "No puedes quitarte el rol de administrador a ti mismo.",
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No autorizado.",
    };
  }

  const nextRole = normalizeRole(role);

  if (isDemoMode()) {
    const user = updateDemoUserRole(userId, nextRole);
    if (!user) return { ok: false, error: "Usuario no encontrado." };
    return { ok: true, user };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role: nextRole })
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo actualizar el rol." };
  }

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: nextRole },
  });

  return { ok: true, user: asProfile(data as Profile) };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdminProfile();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No autorizado.",
    };
  }

  if (newPassword.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (isDemoMode()) {
    const exists = getDemoAgents().some((p) => p.id === userId);
    if (!exists) return { ok: false, error: "Usuario no encontrado." };
    // Demo has no real Auth passwords; acknowledge the action.
    return { ok: true };
  }

  const supabase = createServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, error: "Usuario no encontrado." };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
