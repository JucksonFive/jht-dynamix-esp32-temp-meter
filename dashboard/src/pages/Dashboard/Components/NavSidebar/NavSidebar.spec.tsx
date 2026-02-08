import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavSidebar } from "src/pages/Dashboard/Components/NavSidebar/NavSidebar";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("src/contexts/ThemeContext", async () => ({
  useTheme: () => ({
    mode: "dark",
    resolved: "dark",
    setMode: vi.fn(),
    toggle: vi.fn(),
  }),
}));

const handleLogout = vi.fn();
vi.mock("../../../../contexts/AppContext", async () => ({
  useAppContext: () => ({
    handleLogout,
  }),
}));

vi.mock("../Buttons/LogoutButton", async () => ({
  default: (props: any) => <button onClick={props.onLogout}>logoutBtn</button>,
}));

describe("pages/Dashboard/Components/NavSidebar/NavSidebar.tsx", () => {
  let onToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleLogout.mockClear();
    onToggle = vi.fn();
  });

  it("renders collapsed sidebar with nav toggle", () => {
    render(<NavSidebar collapsed onToggle={onToggle} />);
    expect(screen.getByTestId("nav-sidebar")).toBeInTheDocument();
    expect(screen.getByLabelText("navExpand")).toBeInTheDocument();
  });

  it("calls onToggle when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<NavSidebar collapsed onToggle={onToggle} />);
    await user.click(screen.getByLabelText("navExpand"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows labels and collapse button when expanded", () => {
    render(<NavSidebar collapsed={false} onToggle={onToggle} />);
    expect(screen.getByText("appTitle")).toBeInTheDocument();
    expect(screen.getByLabelText("navCollapse")).toBeInTheDocument();
  });

  it("calls handleLogout when collapsed logout icon is clicked", async () => {
    const user = userEvent.setup();
    render(<NavSidebar collapsed onToggle={onToggle} />);
    await user.click(screen.getByLabelText("logout"));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("shows LogoutButton when expanded", async () => {
    const user = userEvent.setup();
    render(<NavSidebar collapsed={false} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: "logoutBtn" }));
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
