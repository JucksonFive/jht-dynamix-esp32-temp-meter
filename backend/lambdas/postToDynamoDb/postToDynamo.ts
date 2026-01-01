import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { Logger, injectLambdaContext } from "@aws-lambda-powertools/logger";
import { Metrics, MetricUnits, logMetrics } from "@aws-lambda-powertools/metrics";
import middy from "@middy/core";
import { randomUUID } from "crypto";

const serviceName = process.env.POWERTOOLS_SERVICE_NAME!;
const namespace = "JHT-Dynamix-IoT";

const logger = new Logger({ serviceName });
const metrics = new Metrics({ namespace, serviceName });

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TEMPS_TABLE = process.env.TABLE_NAME;
const DEVICES_TABLE = process.env.DEVICES_TABLE;

if (!TEMPS_TABLE) {
  logger.error("TABLE_NAME environment variable is not set.");
  throw new Error("TABLE_NAME environment variable is not set.");
}

if (!DEVICES_TABLE) {
  logger.error("DEVICES_TABLE environment variable is not set.");
  throw new Error("DEVICES_TABLE environment variable is not set.");
}

type IngestEvent = {
  deviceId?: string;
  temperature?: unknown;
  humidity?: unknown;
  timestamp?: unknown;
  userId?: string;
};

const appendLogContext = () => ({
  before: (request: { event?: IngestEvent }) => {
    const deviceId = request.event?.deviceId;
    logger.appendKeys({
      correlation_id: randomUUID(),
      device_id: deviceId ?? "unknown",
    });
  },
});

const baseHandler = async (event: IngestEvent) => {
  const { deviceId, temperature, humidity, timestamp } = event ?? {};

  const startTime = Date.now();
  const timestampIsValid =
    typeof timestamp === "string" || typeof timestamp === "number";

  if (
    !deviceId ||
    typeof temperature !== "number" ||
    typeof humidity !== "number" ||
    !timestampIsValid
  ) {
    logger.warn("Invalid payload received", {
      error_code: "InvalidMessageFormat",
      details: {
        deviceId,
        temperatureType: typeof temperature,
        humidityType: typeof humidity,
        timestampType: typeof timestamp,
      },
    });
    metrics.addMetric("InvalidMessageFormat", MetricUnits.Count, 1);
    return { statusCode: 400, body: "Invalid payload" };
  }

  // Resolve userId from Devices table
  let userId = event.userId;
  try {
    const res = await ddb.send(
      new GetCommand({ TableName: DEVICES_TABLE, Key: { deviceId } })
    );
    userId = (res.Item as { userId?: string })?.userId ?? userId ?? "unknown";
  } catch (error) {
    logger.warn("Device lookup failed, continuing.", { error });
    userId = userId ?? "unknown";
  }

  // Temperatures PK/SK = deviceId + timestamp
  const item = { deviceId, timestamp, userId, temperature, humidity };

  try {
    await ddb.send(new PutCommand({ TableName: TEMPS_TABLE, Item: item }));

    const latency = Date.now() - startTime;

    logger.info("Successfully ingested temperature reading");
    metrics.addMetric("SuccessfulIngestion", MetricUnits.Count, 1);
    metrics.addMetric("ProcessingLatency", MetricUnits.Milliseconds, latency);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    logger.error("Error writing to DynamoDB", { error });
    throw error;
  }
};

export const handler = middy(baseHandler)
  .use(appendLogContext())
  .use(injectLambdaContext(logger, { logEvent: true }))
  .use(logMetrics(metrics, { captureColdStartMetric: true }));
