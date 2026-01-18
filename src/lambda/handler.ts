import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";

// Define reusable types
type LambdaEvent = APIGatewayProxyEventV2;
type LambdaResult = Promise<APIGatewayProxyResult>;
type LambdaHandler = (event: LambdaEvent) => LambdaResult;

export const handler: LambdaHandler = async (event) => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    if (path === "/users") {
      switch (method) {
        case "GET":
          return getAllUsers(event);
        case "POST":
          return createUser(event);

        default:
          return {
            statusCode: 405,
            body: JSON.stringify({
              message: "Unsupported HTTP method for /users path",
            }),
          };
      }
    }

    if (path.startsWith("/users/")) {
      const userId = path.split("/")[2];
    }
  } catch (error) {}
};

const getAllUsers: LambdaHandler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "fetch All Users",
    }),
  };
};

const createUser: LambdaHandler = async (event) => {
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "create User",
    }),
  };
};

const getUser = async (userId: string): LambdaResult => {
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "fetch single user",
    }),
  };
};

const updateUser = async (userId: string, event: LambdaEvent): LambdaResult => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "user has been updated.",
    }),
  };
};

const deleteUser = async (userId: string): LambdaResult => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      // normally we do not return message on delete.
      message: `user with id: ${userId} has been deleted.`,
    }),
  };
};
