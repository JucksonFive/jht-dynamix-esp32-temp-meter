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
