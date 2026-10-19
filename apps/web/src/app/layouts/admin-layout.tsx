import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AdminHeader } from "@/features/auth";
import { AdminLoadingFallback } from "../router/admin-loading-fallback";

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-foreground">
      <AdminHeader />
      <main className="flex-1 flex flex-col min-w-0">
        <Suspense fallback={<AdminLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
