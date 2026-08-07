export interface Grupo {
  nombre: string;
  categorias: string[];
}

export const GRUPOS: Grupo[] = [
  { nombre: "Mates", categorias: ["Torpedo", "Camionero", "Imperial", "Criollo", "Ranchero", "Algarrobo"] },
  { nombre: "Bombillas", categorias: ["Alpaca", "Acero"] },
];

export const SUELTAS: string[] = ["Termos/Vasos", "Yerbas", "Yerberas", "Materas", "Combos", "Set Asado", "Accesorios"];
