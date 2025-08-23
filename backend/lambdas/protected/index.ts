export const handler = async (event: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "You are authenticated",
      claims: event.requestContext.authorizer.claims,
    }),
  };
};
