export type IoTEvent = {
  payload: string;
  topic?: string;
  messageId?: string;
  [key: string]: any;
};
