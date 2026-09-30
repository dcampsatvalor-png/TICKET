"use server";

import { revalidatePath } from "next/cache";
import { createUserAccount, setUserRole } from "@/lib/users/service";
import type { AppRole } from "@/types/database";

export async function createUserAction(input: {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
}) {
  const result = await createUserAccount(input);
  if (result.ok) {
    revalidatePath("/admin");
  }
  return result;
}

export async function updateUserRoleAction(userId: string, role: AppRole) {
  const result = await setUserRole(userId, role);
  if (result.ok) {
    revalidatePath("/admin");
  }
  return result;
}
