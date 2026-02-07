import { render, screen } from "@testing-library/react";

// Mock react-three-fiber — WebGL is not available in JSDOM
vi.mock("@react-three/fiber", async () => ({
  Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
  useFrame: () => {},
}));

vi.mock("src/contexts/ThemeContext", async () => ({
  useTheme: () => ({
    mode: "dark",
    resolved: "dark",
    setMode: vi.fn(),
    toggle: vi.fn(),
  }),
}));

vi.mock("three", async () => {
  const Color = vi.fn().mockImplementation(() => ({
    r: 0,
    g: 0,
    b: 0,
    clone: vi.fn().mockReturnThis(),
    lerp: vi.fn().mockReturnThis(),
  }));
  const Vector3 = vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    z: 0,
    add: vi.fn().mockReturnThis(),
    copy: vi.fn().mockReturnThis(),
    distanceTo: vi.fn().mockReturnValue(10),
  }));
  const Object3D = vi.fn().mockImplementation(() => ({
    position: { copy: vi.fn() },
    scale: { setScalar: vi.fn() },
    updateMatrix: vi.fn(),
    matrix: {},
  }));
  const BufferGeometry = vi.fn().mockImplementation(() => ({
    setAttribute: vi.fn(),
    setDrawRange: vi.fn(),
    attributes: {
      position: { array: new Float32Array(3600), needsUpdate: false },
      color: { array: new Float32Array(3600), needsUpdate: false },
    },
  }));
  const BufferAttribute = vi.fn();
  return { Color, Vector3, Object3D, BufferGeometry, BufferAttribute };
});

import { LoginScene } from "src/pages/Login/Components/LoginScene";

describe("pages/Login/Components/LoginScene.tsx", () => {
  it("renders the scene container", () => {
    render(<LoginScene />);
    expect(screen.getByTestId("login-scene")).toBeInTheDocument();
  });
});
