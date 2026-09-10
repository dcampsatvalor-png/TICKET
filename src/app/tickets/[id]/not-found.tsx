import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold text-slate-900">
        Ticket no encontrado
      </h1>
      <p className="max-w-sm text-slate-600">
        El ticket que buscas no existe o ya no está disponible.
      </p>
      <Button
        className="bg-teal-600 hover:bg-teal-700"
        render={<Link href="/tickets" />}
      >
        Volver al listado
      </Button>
    </div>
  );
}
