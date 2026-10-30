import { describe, it, expect } from "vitest";
import { buildConsultaLink, buildContactoLink } from "@/lib/whatsapp";

describe("whatsapp links", () => {
  it("builds a product consulta link with bold whatsapp formatting", () => {
    const link = buildConsultaLink({ nombre: "Mate Torpedo", precio: 15000, estado: "Disponible" });
    expect(link).toBe(
      "https://wa.me/5493476617678?text=" +
        encodeURIComponent("Hola, tengo una consulta por *Mate Torpedo - $15000*")
    );
  });

  it("asks about availability and price, without the price, when the product is out of stock", () => {
    const link = buildConsultaLink({ nombre: "Mate Torpedo", precio: 15000, estado: "Sin stock" });
    expect(link).toBe(
      "https://wa.me/5493476617678?text=" +
        encodeURIComponent("Hola, quiero saber si se consigue *Mate Torpedo* y qué precio tiene")
    );
    expect(decodeURIComponent(link)).not.toContain("15000");
  });

  it("builds a generic contact link", () => {
    const link = buildContactoLink();
    expect(link).toBe("https://wa.me/5493476617678");
  });
});
