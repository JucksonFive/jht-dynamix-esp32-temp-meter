import { render, screen } from "@testing-library/react";

// Mock react-three-fiber — WebGL is not available in JSDOM
vi.mock("@react-three/fiber", async () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: () => {},
}));

vi.mock("src/contexts/ThemeContext", async () => ({
  useTheme: () => ({
    mode: "light",
    resolved: "light",
    setMode: vi.fn(),
    toggle: vi.fn(),
  }),
}));

vi.mock("three", () => {
  class Color {
    r = 0;
    g = 0;
    b = 0;
    clone() {
      return this;
    }
    lerp() {
      return this;
    }
  }
  class Vector3 {
    x = 0;
    y = 0;
    z = 0;
    add() {
      return this;
    }
    copy() {
      return this;
    }
    distanceTo() {
      return 10;
    }
  }
  class Object3D {
    position = { copy: vi.fn() };
    scale = { setScalar: vi.fn() };
    matrix = {};
    updateMatrix() {}
  }
  class BufferGeometry {
    attributes = {
      position: { array: new Float32Array(3600), needsUpdate: false },
      color: { array: new Float32Array(3600), needsUpdate: false },
    };
    setAttribute() {}
    setDrawRange() {}
  }
  class BufferAttribute {}
  return { Color, Vector3, Object3D, BufferGeometry, BufferAttribute };
});

import { DashboardScene } from "src/pages/Dashboard/Components/DashboardScene";

describe("pages/Dashboard/Components/DashboardScene.tsx", () => {
  it("renders the scene container", () => {
    render(<DashboardScene />);
    expect(screen.getByTestId("dashboard-scene")).toBeInTheDocument();
  });

  it("has pointer-events-none class for non-interactive overlay", () => {
    render(<DashboardScene />);
    expect(screen.getByTestId("dashboard-scene")).toHaveClass(
      "pointer-events-none",
    );
  });
});
