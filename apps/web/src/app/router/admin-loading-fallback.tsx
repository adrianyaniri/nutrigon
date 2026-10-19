export function AdminLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[300px] flex-1 items-center justify-center p-8 text-muted-foreground"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="size-8 animate-spin rounded-full border-2 border-brand-gold border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-xs font-medium">Cargando módulo de gestión...</span>
      </div>
    </div>
  );
}
