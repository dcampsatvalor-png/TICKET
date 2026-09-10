import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { getCurrentProfile } from "@/lib/tickets/service";

export default async function HomePage() {
  if (isDemoMode()) {
    redirect("/tickets");
  }
  const profile = await getCurrentProfile();
  redirect(profile ? "/tickets" : "/login");
}
