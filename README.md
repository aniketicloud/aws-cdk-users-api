# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template


## Learning notes

# 3. Project 3 : Users API - DynamoDB + API Gateway + Lambda Stack

## DynamoDB Overview

Amazon DynamoDB is a fully managed NoSQL database service provided by AWS that offers seamless scalability and high performance for applications requiring consistent, single-digit millisecond latency at any scale. It's designed to handle massive workloads and automatically scales up or down based on your application's needs without requiring manual intervention. DynamoDB supports both document and key-value data models, making it versatile for various use cases from gaming and mobile applications to IoT and web applications. The service provides built-in security, backup and restore capabilities, and in-memory caching with DynamoDB Accelerator (DAX) for microsecond performance.

**Cost Structure**

DynamoDB pricing is based on two primary models: **On-Demand** and **Provisioned** capacity. With **On-Demand** pricing, you pay only for the data you read and write, with no capacity planning required - costs are $1.25 per million write request units and $0.25 per million read request units. **Provisioned** capacity requires you to specify read and write capacity units in advance, with costs of $0.00065 per write capacity unit-hour and $0.00013 per read capacity unit-hour. Storage costs $0.25 per GB-month for the first 25TB, with additional storage tiers offering reduced rates. DynamoDB also charges for data transfer out of AWS regions ($0.09 per GB for the first 10TB), backup storage ($0.10 per GB-month for continuous backups), and point-in-time recovery ($0.20 per GB-month). The service includes 25GB of storage and 25 write/read capacity units free tier per month for the first 12 months, making it cost-effective for development and small applications.

## Create a Project

- On the desktop, create the project `users-api`, open it, and run `npx cdk init`. Pick "app" and run the command.
- run `npm i esbuild @faker-js/faker uuid @types/uuid @types/aws-lambda @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`

### Library Explanations

- **@faker-js/faker**: Generates realistic fake data for testing and development purposes, including names, addresses, emails, and other user information. It's essential for creating mock data to populate our users API with sample records.

- **uuid**: Creates universally unique identifiers (UUIDs) that are guaranteed to be unique across distributed systems. It's used to generate unique IDs for each user record in our DynamoDB database.

- **@types/uuid**: Provides TypeScript type definitions for the uuid library, enabling better IntelliSense and type checking when working with UUIDs in TypeScript code.

- **@types/aws-lambda**: Contains TypeScript type definitions for AWS Lambda functions, including event types, context objects, and callback functions. It ensures type safety when developing Lambda functions for our API.

- **@aws-sdk/client-dynamodb**: The core AWS SDK v3 client for DynamoDB that provides low-level access to DynamoDB operations like PutItem, GetItem, Query, and Scan. It handles the direct communication with DynamoDB service.

- **@aws-sdk/lib-dynamodb**: A higher-level library that simplifies DynamoDB operations by automatically handling data marshalling and unmarshalling between JavaScript objects and DynamoDB's AttributeValue format. It makes working with DynamoDB much more developer-friendly by allowing you to work with plain JavaScript objects instead of complex AttributeValue structures.

## API Structure

- create `src/lambda/handler.ts`

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Handle /users path operations
    if (path === '/users') {
      switch (method) {
        case 'GET':
          return getAllUsers(event);
        case 'POST':
          return createUser(event);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for /users path' }),
          };
      }
    }

    // Handle /users/{id} path operations
    if (path.startsWith('/users/')) {
      const userId = path.split('/users/')[1];
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID is required' }),
        };
      }

      switch (method) {
        case 'GET':
          return getUser(userId);
        case 'PUT':
          return updateUser(event, userId);
        case 'DELETE':
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for user operations' }),
          };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function createUser(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // const { name, email } = JSON.parse(event.body as string);

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'create user' }),
  };
}

async function getAllUsers(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'fetch all users' }),
  };
}

async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'fetch single user' }),
  };
}

async function updateUser(event: APIGatewayProxyEventV2, userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'update user' }),
  };
}

async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'delete user' }),
  };
}
```

`stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigateway_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class UsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a single Lambda function for all operations
    const userHandler = new NodejsFunction(this, 'UserHandler', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'handler',
      functionName: `${this.stackName}-user-handler`,
    });

    const httpApi = new apigateway.HttpApi(this, 'UserApi', {
      apiName: 'User API',
      description: 'User Management API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    // Define routes configuration
    const routes = [
      { path: '/users', method: apigateway.HttpMethod.GET, name: 'GetAllUsers' },
      { path: '/users', method: apigateway.HttpMethod.POST, name: 'CreateUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.GET, name: 'GetUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.PUT, name: 'UpdateUser' },
      { path: '/users/{id}', method: apigateway.HttpMethod.DELETE, name: 'DeleteUser' },
    ];

    // Add all routes
    routes.forEach(({ path, method, name }) => {
      httpApi.addRoutes({
        path,
        methods: [method],
        integration: new apigateway_integrations.HttpLambdaIntegration(`${name}Integration`, userHandler),
      });
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url ?? '',
      description: 'HTTP API URL',
    });
  }
}
```

- run `npx cdk deploy`

- create `makeRequests.http`

```ts


@URL = https://5g5nfth0pf.execute-api.eu-north-1.amazonaws.com/


### Get all users
GET {{URL}}/users

### Create a user
POST {{URL}}/users
Content-Type: application/json

{
    "name": "coding addict"
}

### Get a user
GET {{URL}}/users/1

### Update a user
PUT {{URL}}/users/1
Content-Type: application/json

{
    "name": "coding addict",
    "email": "coding@addict.com"
}

### Delete a user
DELETE {{URL}}/users/1

```

## DynamoDB

- create `lib/dynamodb-stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DynamoDBStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: `${this.stackName}-users-table`,
    });
  }
}
```

- **`partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }`**: Defines the primary key for the table where `id` is the partition key field and it stores string values. This is the main identifier for each user record and determines how data is distributed across DynamoDB's partitions.

**Primary Key**: A unique identifier that ensures no two items in the table can have the same value.

- **`billingMode: dynamodb.BillingMode.PAY_PER_REQUEST`**: Sets the table to use on-demand billing, meaning you only pay for the actual read/write operations performed rather than provisioning capacity in advance. This is cost-effective for variable workloads.

- **`removalPolicy: cdk.RemovalPolicy.DESTROY`**: Specifies that when the CDK stack is destroyed, the DynamoDB table should be completely deleted along with all its data. This is useful for development environments but should be used cautiously in production.

- **`tableName: \`${this.stackName}-users-table\``**: Creates a unique table name by combining the stack name with "users-table", ensuring the table has a predictable and unique identifier across different deployments.

A **partition** in DynamoDB is like a storage container that holds multiple user records. Think of it as a filing cabinet drawer where you store related files. DynamoDB uses a hash function on your partition key to decide which "drawer" (partition) should store each user. Using `id` as the partition key makes perfect sense because: 1) Each user has a unique ID, so data gets distributed evenly across partitions, 2) Most API operations are "get user by ID" or "update user by ID", which become lightning-fast since DynamoDB knows exactly which partition to look in, and 3) It's simple and predictable - no complex query patterns needed. When you query for a specific user ID, DynamoDB instantly knows which partition contains that user and retrieves it in milliseconds.

`bin/user-api.ts`

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { UsersApiStack } from '../lib/users-api-stack';

const app = new cdk.App();

// Create DynamoDB stack
const dynamodbStack = new DynamoDBStack(app, 'DynamoDBStack');

// Create Lambda stack with table name
const userApiStack = new UsersApiStack(app, 'UsersApiStack', { dynamodbStack });

userApiStack.addDependency(dynamodbStack);
```

`stack.ts`

```ts
import { DynamoDBStack } from './dynamodb-stack';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface UsersApiStackProps extends cdk.StackProps {
  dynamodbStack: DynamoDBStack;
}

export class UsersApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: UsersApiStackProps) {
    super(scope, id, props);

    // Create a single Lambda function for all operations
    const userHandler = new NodejsFunction(this, 'UserHandler', {
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/lambda/handler.ts'),
      handler: 'handler',
      functionName: `${this.stackName}-user-handler`,
      environment: {
        TABLE_NAME: props.dynamodbStack.usersTable.tableName,
      },
    });

    // Grant the Lambda function access to the DynamoDB table
    props.dynamodbStack.usersTable.grantReadWriteData(userHandler);
  }
}
```

`handler.ts`

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  try {
    // Handle /users path operations
    if (path === '/users') {
      switch (method) {
        case 'GET':
          return getAllUsers(event);
        case 'POST':
          return createUser(event);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for /users path' }),
          };
      }
    }

    // Handle /users/{id} path operations
    if (path.startsWith('/users/')) {
      const userId = path.split('/users/')[1];
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'User ID is required' }),
        };
      }

      switch (method) {
        case 'GET':
          return getUser(userId);
        case 'PUT':
          return updateUser(event, userId);
        case 'DELETE':
          return deleteUser(userId);
        default:
          return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Unsupported HTTP method for user operations' }),
          };
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function createUser(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  // const { name, email } = JSON.parse(event.body as string);
  const userId = uuidv4();

  const user = {
    id: userId,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: new Date().toISOString(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify(user),
  };
}

async function getUser(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'User not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
}

async function getAllUsers(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const result = await dynamoDB.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items || []),
  };
}

async function updateUser(event: APIGatewayProxyEventV2, userId: string): Promise<APIGatewayProxyResultV2> {
  const { name, email } = JSON.parse(event.body!);

  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
      UpdateExpression: 'SET #name = :name, #email = :email',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':name': name || null,
        ':email': email || null,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes),
  };
}

async function deleteUser(userId: string): Promise<APIGatewayProxyResultV2> {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: userId },
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'user deleted' }),
  };
}
```

## UpdateCommand Explanation

This code updates a user record in DynamoDB using the `UpdateCommand`. Here's how it works:

### 1. **Command Structure**

```typescript
new UpdateCommand({
  TableName: TABLE_NAME, // Which DynamoDB table to update
  Key: { id: userId }, // Which record to update (primary key)
  UpdateExpression: 'SET #name = :name, #email = :email', // What to change
  ExpressionAttributeNames: {
    // Placeholder names for attributes
    '#name': 'name',
    '#email': 'email',
  },
  ExpressionAttributeValues: {
    // Actual values to set
    ':name': name || null,
    ':email': email || null,
  },
  ReturnValues: 'ALL_NEW', // Return the updated record
});
```

### 2. **Key Components**

- **`TableName`**: Specifies which DynamoDB table to update
- **`Key`**: Identifies the specific record using the primary key (`id`)
- **`UpdateExpression`**: DynamoDB's way of specifying what to change
  - `SET` means "set these values"
  - `#name = :name` means "set the name attribute to the name value"

### 3. **Expression Attributes**

- **`ExpressionAttributeNames`**: Maps placeholders to actual attribute names
  - `#name` → `name`
  - `#email` → `email`
- **`ExpressionAttributeValues`**: Maps placeholders to actual values
  - `:name` → the name from the request body
  - `:email` → the email from the request body

### 4. **Why Use Placeholders?**

This prevents **injection attacks** and handles **reserved words**:

```typescript
// ❌ Bad - vulnerable to injection
UpdateExpression: `SET name = '${name}', email = '${email}'`;

// ✅ Good - safe with placeholders
UpdateExpression: 'SET #name = :name, #email = :email';
```

### 5. **ReturnValues: 'ALL_NEW'**

Returns the complete updated record after the update, so you can confirm what was changed.

### 6. **Null Handling**

```typescript
':name': name || null,
':email': email || null,
```

If no value is provided, it sets the field to `null` instead of leaving it unchanged.

This is a secure, efficient way to update specific fields in a DynamoDB record while preventing injection attacks and handling edge cases properly.

## Front-End App

- explore front-end app
- spin up the local dev instance
- deploy to Netlify
- change 'allowOrigins', don't forget about removing trailing '/'
