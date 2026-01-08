import { render, screen } from "@testing-library/react";

import { SelectDeviceHelp } from "src/pages/Dashboard/Components/SidePanel/SelectDeviceHelp";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("pages/Dashboard/Components/SidePanel/SelectDeviceHelp.tsx", () => {
  it("renders translated help message", () => {
    render(<SelectDeviceHelp />);
    expect(screen.getByText("selectDeviceHelp")).toBeInTheDocument();
  });
});
