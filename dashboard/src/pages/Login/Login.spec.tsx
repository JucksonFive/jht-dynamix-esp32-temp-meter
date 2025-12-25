import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "./Login";
vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const signIn = vi.fn();
const signUp = vi.fn();
const getCurrentUser = vi.fn();
vi.mock("@aws-amplify/auth", async () => ({
  signIn: (...args: any[]) => signIn(...args),
  signUp: (...args: any[]) => signUp(...args),
  getCurrentUser: (...args: any[]) => getCurrentUser(...args),
}));

const getRuntimeConfig = vi.fn();
vi.mock("../../utils/runtimeConfig", async () => ({
  getRuntimeConfig: (...args: any[]) => getRuntimeConfig(...args),
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
      })
    );
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1));

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
