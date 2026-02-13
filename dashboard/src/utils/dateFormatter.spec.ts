import {
  fmtTime,
  fmtYMD,
  formatDate,
  formatDateTime,
  formatTime,
  parseYMD,
  toLocalOffsetIso,
} from "src/utils/dateFormatter";

describe("utils/dateFormatter.ts", () => {
  it("formats date/time outputs with expected shape", () => {
    const iso = "2025-11-27T12:34:56.000Z";

    // Time separator varies by locale (":" vs ".").
    expect(formatDateTime(iso)).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}[:.]\d{2}$/);
    expect(formatDate(iso)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    expect(formatTime(iso)).toMatch(/^\d{2}[:.]\d{2}$/);
  });

  it("supports YMD helpers", () => {
    const d = parseYMD("2025-12-24");
    expect(fmtYMD(d)).toBe("2025-12-24");
  });

  it("generates ISO with local offset", () => {
    const d = new Date("2025-12-24T00:00:00.000Z");
    const s = toLocalOffsetIso(d);
    // Some environments may serialize zero-offset as 'Z' instead of '+00:00'.
    expect(s).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/,
    );
  });

  it("formats chart tick time (non-empty)", () => {
    const s = fmtTime(new Date("2025-12-24T10:15:00.000Z"));
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });
});
