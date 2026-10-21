import { formatPrice } from "@/lib/format/price";
import type { SaleUnit } from "@/features/catalog/types";
import { portionGrams, formatWeight } from "@/features/catalog/lib/portion-pricing";

export interface OrderItem {
  name: string;
  quantity: number;
  saleUnit: SaleUnit;
  portion?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface FormatOrderMessageParams {
  branchName: string;
  items: readonly OrderItem[];
  total: number;
  fulfillment: "pickup" | "delivery";
  customerName: string;
  notes?: string;
}

function describeSaleUnit(unit: SaleUnit, portion?: string): string {
  if (unit === "WEIGHT") {
    if (!portion) throw new Error("Weight portion is required");
    portionGrams(portion);
    return `Granel · ${portion}`;
  }
  return "Unidad";
}

export function formatWhatsAppOrderMessage({
  branchName,
  items,
  total,
  fulfillment,
  customerName,
  notes,
}: FormatOrderMessageParams): string {
  const itemsList = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name} (${describeSaleUnit(item.saleUnit, item.portion)})${item.saleUnit === "WEIGHT" ? ` · ${formatWeight(portionGrams(item.portion!) * item.quantity)} en total · ${formatPrice(item.unitPrice)} por paquete` : ""} — ${formatPrice(item.lineTotal)}`
    )
    .join("\n");

  const fulfillmentText =
    fulfillment === "pickup"
      ? "Retiro en mostrador (sin costo)"
      : "Envío a domicilio (a coordinar)";

  const clientText = customerName.trim() || "A coordinar";
  const notesText = notes?.trim() ? `\n📝 Notas: ${notes.trim()}` : "";

  return (
    `¡Hola Nutrigon (Sucursal ${branchName})! 👋\n` +
    `Quiero realizar el siguiente pedido:\n\n` +
    `${itemsList}\n\n` +
    `💰 Total estimado: ${formatPrice(total)}\n` +
    `📦 Modalidad: ${fulfillmentText}\n` +
    `👤 Cliente: ${clientText}` +
    notesText
  );
}

export function buildWhatsAppOrderUrl(
  whatsappNumber: string | null | undefined,
  message: string
): string {
  const cleanPhone = whatsappNumber ? whatsappNumber.replace(/[^\d]/g, "") : "";
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
