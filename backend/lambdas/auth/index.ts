import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { username, password } = body;

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
