export type DateStr = string;

export type Range = { from: DateStr; to: DateStr };

export type DeviceData = {
  id: string;
  temperature: number;
  timestamp: string;
};
