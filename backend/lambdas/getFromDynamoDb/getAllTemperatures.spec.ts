import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const sendMock = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/lib-dynamodb");
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: () => ({
        send: (cmd: any) => sendMock(cmd),
      }),
    },
  };
});

describe("getAllTemperatures handler", () => {
  const { handler } = require("./getAllTemperatures");

  beforeEach(() => {
    sendMock.mockReset();
    process.env.TABLE_NAME = "Temperatures";
  });

  it("queries by deviceId when provided", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [{ deviceId: "a", temperature: 1 }],
    });

    const res = await handler({
      queryStringParameters: { deviceId: "a" },
    } as any);

    expect(res.statusCode).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(QueryCommand);
    expect(JSON.parse(res.body)[0].deviceId).toBe("a");
  });

  it("scans table when no deviceId provided", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [{ deviceId: "b", temperature: 2 }],
    });

    const res = await handler({} as any);
    expect(res.statusCode).toBe(200);
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(ScanCommand);
  });

  it("returns 500 on error", async () => {
    sendMock.mockRejectedValueOnce(new Error("ddb fail"));
    const res = await handler({} as any);
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe("Server error");
  });
});
