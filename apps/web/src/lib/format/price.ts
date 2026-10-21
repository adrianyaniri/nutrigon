const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  const formatted = priceFormatter.format(value);
  // Keep whole-peso output unchanged, but always show both cent digits when needed.
  return formatted.replace(/,(\d)$/, ",$10");
}
