import { bucketizeMulti, pickBucketMs, spanMs, type MultiPoint } from "./utils";

describe("utils/utils.ts", () => {
  it("spanMs clamps to >= 0", () => {
    expect(spanMs({ from: "2025-12-24", to: "2025-12-25" })).toBeGreaterThan(0);
    expect(spanMs({ from: "2025-12-25", to: "2025-12-24" })).toBe(0);
  });

  it("pickBucketMs chooses expected buckets", () => {
    expect(pickBucketMs(10)).toBe(60_000);
    expect(pickBucketMs(3600_000)).toBe(60_000);
    expect(pickBucketMs(2 * 3600_000)).toBe(5 * 60_000);
    expect(pickBucketMs(2 * 86400_000)).toBe(15 * 60_000);
    expect(pickBucketMs(10 * 86400_000)).toBe(60 * 60_000);
  });

  it("bucketizeMulti averages values per device per bucket", () => {
    const r = {
      from: "2025-12-24T00:00:00.000Z",
      to: "2025-12-24T01:00:00.000Z",
    };
    const points: MultiPoint[] = [
      { id: "a", timestamp: "2025-12-24T00:00:00.000Z", temperature: 10 },
      { id: "a", timestamp: "2025-12-24T00:00:30.000Z", temperature: 14 },
      { id: "b", timestamp: "2025-12-24T00:00:40.000Z", temperature: 20 },
    ];

    const out = bucketizeMulti(points, r);
    expect(out.deviceIds).toEqual(["a", "b"]);
    expect(out.rows.length).toBe(1);
    expect(out.rows[0].ts).toBeInstanceOf(Date);
    // a should be avg(10,14)=12
    expect(out.rows[0]["a"]).toBe(12);
    expect(out.rows[0]["b"]).toBe(20);
  });

  it("bucketizeMulti returns empty when no points", () => {
    const out = bucketizeMulti([], { from: "2025-12-24", to: "2025-12-25" });
    expect(out).toEqual({ rows: [], deviceIds: [] });
  });
});
