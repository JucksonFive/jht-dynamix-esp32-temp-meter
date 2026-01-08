import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "src/App";
import { AppProvider } from "src/contexts/AppContext";

vi.mock("aws-amplify/auth", () => {
  return {
    getCurrentUser: vi.fn().mockRejectedValue(new Error("not signed in")),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./hooks/useDevices", () => {
  return {
    useDevices: () => ({
      devices: [],
      loading: false,
      removeDevice: () => {},
    }),
  };
});

vi.mock("./hooks/useReadings", () => {
  return {
    useReadings: () => ({
      data: [],
      loading: false,
      error: null,
      lastSeen: new Map(),
    }),
  };
});

vi.mock("./pages/Login/Login", () => ({
  default: () => <div>Login</div>,
}));

vi.mock("./pages/Dashboard/Dashboard", () => ({
  default: () => <div>Dashboard</div>,
}));

test("renders login when unauthenticated", async () => {
  render(
    <AppProvider>
      <App />
    </AppProvider>
  );

  await waitFor(() => {
    expect(screen.getByText("Login")).toBeInTheDocument();
  });
});
