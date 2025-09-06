export type Reading = {
  deviceId: string;
  timestamp: string; // ISO8601
  temperature: number; // Celsius
  userId: string;
};

export type ReadingsResponse = {
  items: Reading[];
  nextKey?: string | null;
};

export interface Device {
  deviceId: string;
  userId: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}
