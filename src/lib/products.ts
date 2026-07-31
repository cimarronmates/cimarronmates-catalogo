import { createClient } from "@supabase/supabase-js";
import type { Producto } from "@/lib/types";

export async function fetchProductos(): Promise<Producto[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("orden_display", { ascending: true });

  if (error) throw error;
  return data as Producto[];
}
