import { render, screen } from "@testing-library/react";

import { DateRangeFilter } from "src/pages/Dashboard/Components/DateRange/DateRangeFilter";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const setRange = vi.fn();
vi.mock("../../../../contexts/AppContext", async () => ({
  useAppContext: () => ({
    range: { from: "2025-12-24", to: "2025-12-25" },
    setRange,
  }),
}));

vi.mock("./DateRangePicker", async () => ({
  DateRangePicker: (props: any) => {
    // simulate a child that would call onChange
    props.onChange({ from: "2025-12-01", to: "2025-12-02" });
    return <div data-testid="picker" />;
  },
}));

describe("pages/Dashboard/Components/DateRange/DateRangeFilter.tsx", () => {
  it("renders title and wires setRange to DateRangePicker", () => {
    render(<DateRangeFilter />);
    expect(screen.getByText("dateRange")).toBeInTheDocument();
    expect(screen.getByTestId("picker")).toBeInTheDocument();
    expect(setRange).toHaveBeenCalledWith({
      from: "2025-12-01",
      to: "2025-12-02",
    });
  });
});
