const CATEGORY_ICONS: Record<string, string> = {
  all: "✨",
  "frutos-secos": "🌰",
  "harinas-granos": "🌾",
  "sin-tacc": "🌾🚫",
  suplementos: "⚡",
  "semillas-frutas": "🌱",
};

export function getCategoryIcon(slug: string | null): string {
  if (!slug) return CATEGORY_ICONS.all;
  return CATEGORY_ICONS[slug] ?? "🌿";
}
