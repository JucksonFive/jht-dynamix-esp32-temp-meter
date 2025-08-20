export type DateStr = string;

export type Range = { from: DateStr; to: DateStr };

export const clampRange = (r: Range, bounds: Range): Range => ({
  from: r.from < bounds.from ? bounds.from : r.from,
  to: r.to > bounds.to ? bounds.to : r.to,
});

export const isAllTime = (r: Range, b: Range) =>
  r.from === b.from && r.to === b.to;

export type Bounds = {
  min: DateStr;
  max: DateStr;
};

export type DeviceData = {
  id: string;
  temperature: number;
  timestamp: string;
};
