import { APIGatewayProxyEventV2 } from "aws-lambda";

const getAllUsers = async (event: APIGatewayProxyEventV2) => {
  return { message: "Get All Users" };
};
