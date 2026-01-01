import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

// We will capture the mock so tests can set return values
const sendMock = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/lib-dynamodb");
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({
        send: (command: any) => sendMock(command),
      }),
    },
  };
});

describe("postToDynamoDb handler", () => {
  let handler: (event: any, context?: any) => Promise<any>;
  const lambdaContext = {
    awsRequestId: "test-request",
    functionName: "SaveToDynamoFunction",
  };

  beforeAll(() => {
    process.env.TABLE_NAME = "Temperatures";
    process.env.DEVICES_TABLE = "Devices";
    process.env.POWERTOOLS_SERVICE_NAME = "IngestionService";
    ({ handler } = require("./postToDynamo"));
  });

  beforeEach(() => {
    sendMock.mockReset();
  });

  it("returns 400 for invalid payload", async () => {
    const res = await handler({} as any, lambdaContext as any);
    expect(res.statusCode).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("writes temperature with resolved userId from device lookup", async () => {
    sendMock
      .mockResolvedValueOnce({ Item: { userId: "user123" } }) // GetCommand
      .mockResolvedValueOnce({}); // PutCommand

    const event = {
      deviceId: "dev1",
      temperature: 22.5,
      humidity: 40.2,
      timestamp: new Date().toISOString(),
    };

    const res = await handler(event, lambdaContext as any);
    expect(res.statusCode).toBe(200);

    // First call GetCommand, second PutCommand
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(GetCommand);
    const putCmd = sendMock.mock.calls[1][0];
    expect(putCmd).toBeInstanceOf(PutCommand);
    expect(putCmd.input.Item.userId).toBe("user123");
    expect(putCmd.input.Item.temperature).toBe(22.5);
  });

  it("falls back to 'unknown' when device lookup fails and no userId present", async () => {
    sendMock
      .mockRejectedValueOnce(new Error("DDB error")) // GetCommand fails
      .mockResolvedValueOnce({}); // PutCommand ok

    const event = {
      deviceId: "dev2",
      temperature: 18.3,
      humidity: 33.1,
      timestamp: new Date().toISOString(),
    };

    const res = await handler(event, lambdaContext as any);
    expect(res.statusCode).toBe(200);
    const putCmd = sendMock.mock.calls[1][0];
    expect(putCmd.input.Item.userId).toBe("unknown");
  });

  it("uses provided userId override when device table has no mapping", async () => {
    sendMock
      .mockResolvedValueOnce({}) // GetCommand returns no Item
      .mockResolvedValueOnce({}); // PutCommand

    const overrideUser = "overrideUser";
    const event = {
      deviceId: "dev3",
      temperature: 30.1,
      humidity: 55.4,
      timestamp: new Date().toISOString(),
      userId: overrideUser,
    };

    const res = await handler(event, lambdaContext as any);
    expect(res.statusCode).toBe(200);
    const putCmd = sendMock.mock.calls[1][0];
    expect(putCmd.input.Item.userId).toBe(overrideUser);
  });

  it("throws when PutCommand fails", async () => {
    sendMock
      .mockResolvedValueOnce({ Item: { userId: "userX" } }) // Get ok
      .mockRejectedValueOnce(new Error("put failed")); // Put fails

    const event = {
      deviceId: "dev4",
      temperature: 10.0,
      humidity: 12.3,
      timestamp: new Date().toISOString(),
    };

    await expect(handler(event, lambdaContext as any)).rejects.toThrow(
      "put failed"
    );
  });
});
