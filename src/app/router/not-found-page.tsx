import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground text-sm">Página no encontrada.</p>
      <Link
        to="/"
        className={buttonVariants({ variant: "outline", className: "min-h-[44px]" })}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
