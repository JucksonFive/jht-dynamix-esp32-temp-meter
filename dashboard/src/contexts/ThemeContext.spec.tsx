import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "src/contexts/ThemeContext";

function Consumer() {
  const { mode, resolved, setMode, toggle } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setMode("light")}>setLight</button>
      <button onClick={() => setMode("dark")}>setDark</button>
      <button onClick={() => setMode("system")}>setSystem</button>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

describe("contexts/ThemeContext.tsx", () => {
  let matchMediaListeners: Map<string, ((e: any) => void)[]>;
  let matchMediaMatches: boolean;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    matchMediaListeners = new Map();
    matchMediaMatches = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchMediaMatches,
        media: query,
        addEventListener: vi.fn((event: string, handler: (e: any) => void) => {
          const key = `${query}:${event}`;
          if (!matchMediaListeners.has(key)) matchMediaListeners.set(key, []);
          matchMediaListeners.get(key)!.push(handler);
        }),
        removeEventListener: vi.fn(
          (event: string, handler: (e: any) => void) => {
            const key = `${query}:${event}`;
            const arr = matchMediaListeners.get(key);
            if (arr) {
              const idx = arr.indexOf(handler);
              if (idx >= 0) arr.splice(idx, 1);
            }
          },
        ),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("throws when useTheme is used outside ThemeProvider", () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });

  it("defaults to system mode when localStorage is empty", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("system");
  });

  it("reads saved mode from localStorage", () => {
    localStorage.setItem("jt-dynamix-theme", "dark");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("setMode(light) updates mode, resolved, and localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "setLight" }));
    expect(screen.getByTestId("mode").textContent).toBe("light");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
    expect(localStorage.getItem("jt-dynamix-theme")).toBe("light");
  });

  it("setMode(dark) applies dark class to documentElement", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "setDark" }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("toggle switches from light to dark and back", async () => {
    localStorage.setItem("jt-dynamix-theme", "light");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("resolved").textContent).toBe("light");

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("resolved").textContent).toBe("dark");

    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("system mode resolves to dark when OS prefers dark", () => {
    matchMediaMatches = true;
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });

  it("system mode resolves to light when OS prefers light", () => {
    matchMediaMatches = false;
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("system");
    expect(screen.getByTestId("resolved").textContent).toBe("light");
  });

  it("handles invalid localStorage value gracefully", () => {
    localStorage.setItem("jt-dynamix-theme", "invalid");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("system");
  });

  it("setMode(system) after explicit mode returns to system", async () => {
    localStorage.setItem("jt-dynamix-theme", "dark");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("mode").textContent).toBe("dark");
    await user.click(screen.getByRole("button", { name: "setSystem" }));
    expect(screen.getByTestId("mode").textContent).toBe("system");
    expect(localStorage.getItem("jt-dynamix-theme")).toBe("system");
  });
});
