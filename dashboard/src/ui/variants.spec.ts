import { applyButtonVariants, buttonIntents, buttonSizes } from "./variants";

describe("ui/variants.ts", () => {
  describe("applyButtonVariants", () => {
    it("returns stable defaults (primary + md + rounded)", () => {
      const cls = applyButtonVariants();

      expect(cls).toContain("inline-flex");
      expect(cls).toContain(buttonIntents.primary);
      expect(cls).toContain(buttonSizes.md);
      expect(cls).toContain("rounded");
    });

    it("applies intent/size/rounded=false", () => {
      const cls = applyButtonVariants({ intent: "danger", size: "lg", rounded: false });

      expect(cls).toContain(buttonIntents.danger);
      expect(cls).toContain(buttonSizes.lg);
      expect(cls).not.toContain("rounded-full");
      expect(cls.split(/\s+/)).not.toContain("rounded");
    });

    it("supports rounded='full'", () => {
      const cls = applyButtonVariants({ rounded: "full" });
      expect(cls).toContain("rounded-full");
    });
  });

  it("exports expected intent and size keys", () => {
    expect(Object.keys(buttonIntents).sort()).toEqual(
      ["danger", "ghost", "link", "outline", "primary", "secondary"].sort()
    );
    expect(Object.keys(buttonSizes).sort()).toEqual(["sm", "md", "lg"].sort());
  });
});
