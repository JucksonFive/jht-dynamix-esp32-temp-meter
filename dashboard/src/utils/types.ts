export type DateStr = string;

export type Range = { from: DateStr; to: DateStr };

export type Nullable<T> = T | null;

export type DeviceData = {
  id: string;
  temperature: number;
  timestamp: string;
};
export interface User {
  userId: string;
  username: string;
  signInDetails?: {
    loginId?: string;
    authFlowType?: string;
  };
}
