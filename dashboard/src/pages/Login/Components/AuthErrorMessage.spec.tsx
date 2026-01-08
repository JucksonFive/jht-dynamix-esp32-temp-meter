import { render, screen } from "@testing-library/react";

import { AuthErrorMessage } from "src/pages/Login/Components/AuthErrorMessage";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Login/Components/AuthErrorMessage.tsx", () => {
  it("renders nothing when no error", () => {
    const { container } = render(<AuthErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders translated error heading when error exists", () => {
    render(<AuthErrorMessage error="boom" />);
    expect(screen.getByText("authError")).toBeInTheDocument();
  });
});
