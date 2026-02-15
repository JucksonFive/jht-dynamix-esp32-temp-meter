import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new CognitoIdentityProviderClient({});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { username, password } = body;
    console.log("Auth input", { username, password: "****" });

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing username or password" }),
      };
    }

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.CLIENT_ID!,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    const authResult = response.AuthenticationResult;
    console.log("Auth success:", authResult);
    return {
      statusCode: 200,
      body: JSON.stringify({
        idToken: authResult?.IdToken,
        userId: extractSubFromToken(authResult?.IdToken),
      }),
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid credentials" }),
    };
  }
};

function extractSubFromToken(token?: string): string | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64").toString("utf8");
  try {
    return JSON.parse(decoded)?.sub;
  } catch {
    return null;
  }
}
