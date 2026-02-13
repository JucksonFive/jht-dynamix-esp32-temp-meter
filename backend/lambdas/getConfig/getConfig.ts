import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { APIGatewayProxyHandler } from "aws-lambda";
import { makeResponse } from "../utils/utils";

const client = new SecretsManagerClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  const respond = makeResponse(event);
  try {
    const secretArn = process.env.SECRET_ARN!;
    const res = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn }),
    );
    const secretString = res.SecretString || "{}";
    const payload = JSON.parse(secretString);
    if (payload.placeholder) delete payload.placeholder;
    return respond(200, payload);
  } catch {
    return respond(500, { message: "Failed to load config" });
  }
};
