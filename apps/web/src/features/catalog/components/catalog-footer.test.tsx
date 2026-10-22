import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CatalogFooter } from "./catalog-footer";

describe("CatalogFooter", () => {
  it("links to Nutrigon's current Instagram account", () => {
    render(<CatalogFooter branches={[]} />);

    expect(screen.getByRole("link", { name: "Instagram @nutri.gon" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/nutri.gon/"
    );
    expect(screen.getByText("@nutri.gon")).toBeInTheDocument();
  });
});
