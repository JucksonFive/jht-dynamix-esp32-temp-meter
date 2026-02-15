import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "src/pages/Login/Login";
vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const signIn = vi.fn();
const signUp = vi.fn();
const getCurrentUser = vi.fn();
vi.mock("@aws-amplify/auth", async () => ({
  signIn: (...args: unknown[]) => signIn(...args),
  signUp: (...args: unknown[]) => signUp(...args),
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
}));

const getRuntimeConfig = vi.fn();
vi.mock("../../utils/runtimeConfig", async () => ({
  getRuntimeConfig: (...args: unknown[]) => getRuntimeConfig(...args),
}));

// Mock the Three.js scene — cannot run WebGL in JSDOM
vi.mock("./Components/LoginScene", async () => ({
  default: () => <div data-testid="login-scene" />,
}));

describe("pages/Login/Login.tsx", () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();

    reloadMock = vi.fn();
    originalLocation = window.location;

    // JSDOM often prevents overriding location.reload directly.
    // Replacing window.location is more reliable.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("calls signIn when configured and reloads when current user exists", async () => {
    const user = userEvent.setup();

    const signedInUser = { username: "john", userId: "u" };
    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signIn.mockResolvedValueOnce({});
    getCurrentUser.mockResolvedValueOnce(signedInUser);

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({
        username: "a@b.com",
        password: "pw",
      }),
    );
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1));

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("shows error when auth config is missing", async () => {
    const user = userEvent.setup();
    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "",
    });

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() =>
      expect(screen.getByText("authError")).toBeInTheDocument(),
    );
  });

  it("shows friendly message for UserPool not configured error", async () => {
    const user = userEvent.setup();
    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signIn.mockRejectedValueOnce(new Error("UserPool not configured"));

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() =>
      expect(screen.getByText("authError")).toBeInTheDocument(),
    );
  });

  it("handles generic auth failure", async () => {
    const user = userEvent.setup();
    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signIn.mockRejectedValueOnce(new Error("Wrong password"));

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() =>
      expect(screen.getByText("authError")).toBeInTheDocument(),
    );
  });

  it("handles non-Error rejection gracefully", async () => {
    const user = userEvent.setup();
    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signIn.mockRejectedValueOnce("string error");

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() =>
      expect(screen.getByText("authError")).toBeInTheDocument(),
    );
  });

  it("toggles to signup mode and calls signUp", async () => {
    const user = userEvent.setup();

    getRuntimeConfig.mockReturnValue({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signUp.mockResolvedValueOnce({});
    getCurrentUser.mockResolvedValueOnce(null);

    render(<Login />);

    // Toggle to signup mode (button text is the i18n key)
    await user.click(screen.getByRole("button", { name: "authCreateAccount" }));

    await user.type(screen.getByPlaceholderText("Email"), "new@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pass123");
    await user.click(screen.getByRole("button", { name: "authSignUp" }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        username: "new@b.com",
        password: "pass123",
        options: { userAttributes: { email: "new@b.com" } },
      }),
    );
  });

  it("does not reload when getCurrentUser returns null after auth", async () => {
    const user = userEvent.setup();

    getRuntimeConfig.mockReturnValueOnce({
      VITE_COGNITO_USER_POOL_ID: "pool",
      VITE_COGNITO_USER_POOL_CLIENT_ID: "client",
    });
    signIn.mockResolvedValueOnce({});
    getCurrentUser.mockRejectedValueOnce(new Error("no user"));

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "authSignIn" }));

    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1));
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
