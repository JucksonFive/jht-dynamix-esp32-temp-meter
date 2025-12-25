import i18n from "./i18n";

describe("locale/i18n.ts", () => {
  it("initializes with English resources", () => {
    expect(i18n.language).toBe("en");
    expect(i18n.t("appTitle")).toBe("JT-DYNAMIX Dashboard");
  });
});
