export type Estado = "Disponible" | "Sin stock";

export interface Producto {
  id: string;
  nombre: string;
  descripcion_corta: string | null;
  imagen_url: string | null;
  categoria: string;
  subcategoria: string;
  atributo: string[] | null;
  estado: Estado;
  precio: number;
  destacado: boolean;
  orden_display: number;
  created_at: string;
}
