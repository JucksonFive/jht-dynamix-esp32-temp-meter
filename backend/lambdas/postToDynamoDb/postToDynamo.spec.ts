// 🔧 Mockit ensin
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: jest.fn(() => ({
      send: mockSend,
    })),
    PutItemCommand: jest.fn((params) => ({
      ...params,
      __type: "PutItemCommand",
    })),
  };
});

// ✅ Tuo vasta mockien jälkeen
import { handler } from "./postToDynamo";

// 🔬 Testit
describe("postToDynamo Lambda", () => {
  beforeAll(() => {
    process.env.TABLE_NAME = "Temperatures";
  });

  beforeEach(() => {
    mockSend.mockClear();
  });

  it("should send data to DynamoDB with correct structure", async () => {
    const event = {
      payload: JSON.stringify({
        deviceId: "dev-001",
        temperature: 23.4,
        humidity: 51,
        timestamp: "2025-05-13T18:00:00.000Z",
      }),
    };

    await handler(event);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const calledWith = mockSend.mock.calls[0][0];

    expect(calledWith.TableName).toBe("Temperatures");
    expect(calledWith.Item).toEqual({
      deviceId: { S: "dev-001" },
      temperature: { N: "23.4" },
      humidity: { N: "51" },
      timestamp: { S: "2025-05-13T18:00:00.000Z" },
    });
  });

  it("should throw if payload is invalid", async () => {
    const badEvent = {
      payload: "not-json",
    };

    await expect(handler(badEvent)).rejects.toThrow();
    expect(mockSend).not.toHaveBeenCalled();
  });
});
