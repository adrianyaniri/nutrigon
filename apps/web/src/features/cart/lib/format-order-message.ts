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

function formatOrderItemLine(item: OrderItem): string {
  if (item.saleUnit === "WEIGHT") {
    if (!item.portion) throw new Error("Weight portion is required");
    const grams = portionGrams(item.portion);
    const weightDetail =
      item.quantity > 1
        ? ` · ${formatWeight(grams * item.quantity)} en total · ${formatPrice(item.unitPrice)} por paquete`
        : "";
    return `• ${item.quantity}x ${item.name} (Granel · ${item.portion})${weightDetail} — ${formatPrice(item.lineTotal)}`;
  }

  const unitDetail =
    item.quantity > 1 ? ` (${formatPrice(item.unitPrice)} c/u)` : "";
  return `• ${item.quantity}x ${item.name}${unitDetail} — ${formatPrice(item.lineTotal)}`;
}

export function formatWhatsAppOrderMessage({
  branchName,
  items,
  total,
  fulfillment,
  customerName,
  notes,
}: FormatOrderMessageParams): string {
  const itemsList = items.map(formatOrderItemLine).join("\n");
  const clientText = customerName.trim() || "A coordinar";
  const notesText = notes?.trim() ? `\n📝 Notas: ${notes.trim()}` : "";

  if (fulfillment === "delivery") {
    return (
      `¡Hola Nutrigon (Sucursal ${branchName})! 👋\n` +
      `Quiero realizar el siguiente pedido:\n\n` +
      `${itemsList}\n\n` +
      `🛒 Subtotal productos: ${formatPrice(total)}\n` +
      `🛵 Modalidad: Envío a domicilio (a coordinar)\n` +
      `👤 Cliente: ${clientText}` +
      notesText +
      `\n\n⚠️ *Costo de envío:* A coordinar con la sucursal según la zona (se suma al subtotal de productos).`
    );
  }

  return (
    `¡Hola Nutrigon (Sucursal ${branchName})! 👋\n` +
    `Quiero realizar el siguiente pedido:\n\n` +
    `${itemsList}\n\n` +
    `💰 Total a pagar: ${formatPrice(total)}\n` +
    `🏪 Modalidad: Retiro en sucursal (sin costo de envío)\n` +
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
