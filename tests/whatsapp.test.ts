import { describe, it, expect } from "vitest";
import { buildConsultaLink, buildContactoLink } from "@/lib/whatsapp";

describe("whatsapp links", () => {
  it("builds a product consulta link with bold whatsapp formatting", () => {
    const link = buildConsultaLink({ nombre: "Mate Torpedo", precio: 15000 });
    expect(link).toBe(
      "https://wa.me/5493476617678?text=" +
        encodeURIComponent("Hola, tengo una consulta por *Mate Torpedo - $15000*")
    );
  });

  it("builds a generic contact link", () => {
    const link = buildContactoLink();
    expect(link).toBe("https://wa.me/5493476617678");
  });
});
