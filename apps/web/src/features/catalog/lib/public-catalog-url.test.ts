import { describe, expect, it } from "vitest";
import { getPublicCatalogUrl, PUBLIC_CATALOG_ORIGIN } from "./public-catalog-url";

describe("getPublicCatalogUrl", () => {
  it("uses the canonical production origin for branch links", () => {
    expect(PUBLIC_CATALOG_ORIGIN).toBe("https://www.nutrigon.ar");
    expect(getPublicCatalogUrl("vergara")).toBe(
      "https://www.nutrigon.ar/catalogo/vergara"
    );
  });

  it("encodes the branch slug as one path segment", () => {
    expect(getPublicCatalogUrl("north/central")).toBe(
      "https://www.nutrigon.ar/catalogo/north%2Fcentral"
    );
  });
});
