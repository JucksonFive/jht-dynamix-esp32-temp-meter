export type Reading = {
  deviceId: string;
  timestamp: string;
  temperature: number;
  userId: string;
};

export type ReadingsResponse = {
  items: Reading[];
  nextKey?: string | null;
};

export interface Device {
  deviceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
