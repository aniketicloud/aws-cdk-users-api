import { APIGatewayProxyEventV2 } from "aws-lambda";

const getAllUsers = async (event: APIGatewayProxyEventV2) => {
  return { message: "Get All Users" };
};

const getUser = async (event: APIGatewayProxyEventV2) => { 
  const userId = event.pathParameters?.userId;
  return { message: `Get User with ID: ${userId}` };
}