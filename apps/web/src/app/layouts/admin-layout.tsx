import { Outlet } from "react-router-dom";
import { AdminHeader } from "@/features/auth";

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-foreground">
      <AdminHeader />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
