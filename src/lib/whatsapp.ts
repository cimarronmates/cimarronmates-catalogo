import { siteConfig } from "@/lib/config";
import type { Producto } from "@/lib/types";

export function buildConsultaLink(
  producto: Pick<Producto, "nombre" | "precio" | "estado">
): string {
  const mensaje =
    producto.estado === "Sin stock"
      ? `Hola, quiero saber si se consigue *${producto.nombre}* y qué precio tiene`
      : `Hola, tengo una consulta por *${producto.nombre} - $${producto.precio}*`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export function buildContactoLink(mensaje?: string): string {
  if (!mensaje) return `https://wa.me/${siteConfig.whatsappNumber}`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}
