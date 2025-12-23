import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
} from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    if (path === "/users") {
      switch (method) {
        case "GET":
          return getAllUsers(event);
        case "POST":
          return addUser(event);

        default:
          return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method not allowed" }),
          };
      }
    }
  } catch (error) {}
};

const getAllUsers = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Get All Users",
    }),
  };
};

const addUser = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Add User",
    }),
  };
};
