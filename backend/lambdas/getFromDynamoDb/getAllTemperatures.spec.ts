const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: jest.fn(),
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/lib-dynamodb");

  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend,
      })),
    },
    ScanCommand: jest.fn((params) => ({ ...params, __type: "ScanCommand" })),
    GetCommand: jest.fn((params) => ({ ...params, __type: "GetCommand" })),
  };
});

import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { handler } from "./getAllTemperatures";

describe("getAllTemperatures Lambda", () => {
  it("should return all items", async () => {
    mockSend.mockResolvedValueOnce({
      Items: [
        { deviceId: "dev-123", temperature: 21 },
        { deviceId: "dev-456", temperature: 23 },
      ],
    });

    const result = await handler({} as any);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(2);
    expect(ScanCommand).toHaveBeenCalledWith({ TableName: "Temperatures" });
  });

  it("should return 404 if item not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const event = {
      queryStringParameters: { deviceId: "not-found" },
    };

    const result = await handler(event as any);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toMatch("Reading not found");
  });
});
