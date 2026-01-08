import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DateRangePicker } from "src/pages/Dashboard/Components/DateRange/DateRangePicker";

vi.mock("react-i18next", async () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("react-datepicker", async () => {
  return {
    default: (props: any) => (
      <button
        type="button"
        data-testid="datepicker"
        onClick={() => props.onChange(new Date("2025-12-24T00:00:00.000Z"))}
      >
        pick
      </button>
    ),
  };
});

describe("pages/Dashboard/Components/DateRange/DateRangePicker.tsx", () => {
  it("calls onChange with formatted yyyy-MM-dd dates", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DateRangePicker
        value={{ from: "2025-12-20", to: "2025-12-25" }}
        onChange={onChange}
      />
    );

    const buttons = screen.getAllByTestId("datepicker");
    // first = from
    await user.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith({
      from: "2025-12-24",
      to: "2025-12-25",
    });
    // second = to
    await user.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith({
      from: "2025-12-20",
      to: "2025-12-24",
    });
  });
});
