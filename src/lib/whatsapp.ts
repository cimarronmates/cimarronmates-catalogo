import { siteConfig } from "@/lib/config";

export function buildConsultaLink(producto: { nombre: string; precio: number }): string {
  const mensaje = `Hola, tengo una consulta por *${producto.nombre} - $${producto.precio}*`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}

export function buildContactoLink(mensaje?: string): string {
  if (!mensaje) return `https://wa.me/${siteConfig.whatsappNumber}`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
}
