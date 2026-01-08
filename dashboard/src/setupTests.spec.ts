import "src/setupTests";

describe("setupTests.ts", () => {
  it("registers jest-dom matchers", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
    el.remove();
  });
});
