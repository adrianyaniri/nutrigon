import {
  Boxes,
  Building2,
  CheckCircle,
  Database,
  Layers,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { envConfig } from "@/app/config/env";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const branches = [
    { id: "sucursal-1", name: "Sucursal 1", status: "Arquitectura lista" },
    { id: "sucursal-2", name: "Sucursal 2", status: "Arquitectura lista" },
    { id: "sucursal-3", name: "Sucursal 3", status: "Arquitectura lista" },
  ];

  const modules = [
    {
      title: "Catálogo Maestro",
      desc: "Productos compartidos con venta por unidad o por peso.",
      icon: Boxes,
    },
    {
      title: "Precios por Sucursal",
      desc: "Precios independientes y auditables por punto de venta.",
      icon: TrendingUp,
    },
    {
      title: "Inventario Segregado",
      desc: "Stock y movimientos separados por sucursal.",
      icon: Layers,
    },
    {
      title: "Ventas y WhatsApp",
      desc: "Registro de ventas y preparación de pedidos para WhatsApp.",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="flex flex-col space-y-8">
      {/* Hero / Banner */}
      <section className="rounded-xl border bg-card p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CheckCircle className="size-3.5" />
              Base Técnica Inicializada
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Sistema de Gestión para Dietética
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Estructura técnica lista para el desarrollo modular de gestión de 3
              sucursales y catálogo web. Sin lógica de negocio prematura.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="default" className="min-h-[44px]">
              Ver Documentación
            </Button>
          </div>
        </div>
      </section>

      {/* Environment Diagnostics Alert */}
      <section className="rounded-xl border p-4 sm:p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          {envConfig.isSupabaseConfigured ? (
            <Database className="size-5 text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="size-5 text-amber-600 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Diagnóstico de Entorno (Supabase)</h3>
            {envConfig.isSupabaseConfigured ? (
              <p className="text-xs text-muted-foreground">
                Cliente Supabase configurado con variables en entorno local.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Variables no configuradas o con valores de ejemplo (.env.example). Para
                conectar Supabase en etapas posteriores, completá{" "}
                <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">
                  .env.local
                </code>{" "}
                con tus credenciales del proyecto.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 3 Branches Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Sucursales del Negocio</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{branch.name}</span>
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  {branch.id}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Precios e inventario independientes listos para modelar.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Modular Architecture Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Módulos de Arquitectura</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">{m.title}</h3>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
