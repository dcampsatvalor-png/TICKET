import type { AppRole, Profile } from "@/types/database";

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "admin";
}

export function normalizeRole(value: unknown): AppRole {
  return value === "admin" ? "admin" : "employee";
}
