import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, AdminDisableUserCommand, AdminEnableUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = "eu-central-1";
const userPoolId = "eu-central-1_BIxQEi7ju";

const cognitoClient = new CognitoIdentityProviderClient({ region });
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Or "http://localhost:5173" for more security
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH,DELETE"
};

export const handler = async (event) => {

    console.log("Users Event:", JSON.stringify(event, null, 2));

    try {
        // 1. Extract context from Authorizer (Cognito)
        const authorizerClaims = event.requestContext?.authorizer?.claims;
        const requesterCompanyId = authorizerClaims?.['custom:company_id'];
        const requesterUserId = authorizerClaims?.sub;

        if (!requesterCompanyId) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: Missing company context" })
            };
        }


        const method = event.httpMethod;
        const resource = event.resource; // e.g. /users or /users/{userId}
        const userIdParam = event.pathParameters?.userId;

        // 2. Routing
        if (method === "GET" && resource === "/users") {
            return await listUsers(requesterCompanyId, event.queryStringParameters);
        }

        if (method === "GET" && resource === "/profile") {
            return await getProfile(requesterCompanyId, requesterUserId);
        }
        if (method === "POST" && resource === "/users") {
            return await createUser(requesterCompanyId, JSON.parse(event.body || "{}"));
        }

        if (method === "PATCH" && resource === "/users/{userId}" && userIdParam) {
            return await updateUser(requesterCompanyId, userIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "DELETE" && resource === "/users/{userId}" && userIdParam) {
            return await deleteUser(requesterCompanyId, userIdParam, requesterUserId);
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in users lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }

};

async function getProfile(companyId, userId) {
    const userRes = await docClient.send(new GetCommand({
        TableName: "gadash_users",
        Key: { userId: userId }
    }));

    const companyRes = await docClient.send(new GetCommand({
        TableName: "gadash_companies",
        Key: { companyId: companyId }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            user: userRes.Item,
            company: companyRes.Item
        })
    };
}


/**
 * List users in the company with optional name filter
 */
async function listUsers(companyId, queryParams) {
    const searchTerm = queryParams?.search;

    let params = {
        TableName: "gadash_users",
        IndexName: "companyIdIndex",
        KeyConditionExpression: "companyId = :cid",
        ExpressionAttributeValues: {
            ":cid": companyId
        }
    };

    if (searchTerm) {
        params.FilterExpression = "contains(#name, :search) OR contains(email, :search)";
        params.ExpressionAttributeNames = {
            "#name": "name"
        };
        params.ExpressionAttributeValues[":search"] = searchTerm;
    }

    const data = await docClient.send(new QueryCommand(params));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ users: data.Items })
    };
}


/**
 * Create a new user in Cognito and DynamoDB
 */
async function createUser(companyId, body) {
    const { email, name, permissions } = body;

    if (!email || !name) {
        return {
            statusCode: 400,
            headers: corsHeaders, // Added this
            body: JSON.stringify({ message: "Email and Name are required" })
        };
    }

    // 1. Create in Cognito
    const cognitoRes = await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" },
            { Name: "name", Value: name },
            { Name: "custom:company_id", Value: companyId }
        ],
        // Default behavior: sends welcome email with temp password
    }));

    const userId = cognitoRes.User.Attributes.find(a => a.Name === "sub").Value;
    const createdAt = new Date().toISOString();

    // 2. Sync to DynamoDB
    const userItem = {
        userId: userId,
        companyId: companyId,
        email: email,
        name: name,
        permissions: permissions || ["user"],
        status: "ACTIVE",
        createdAt: createdAt,
        updatedAt: createdAt
    };

    await docClient.send(new PutCommand({
        TableName: "gadash_users",
        Item: userItem
    }));

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "User created successfully", user: userItem })
    };
}


/**
 * Update user (permissions, status, name)
 */
async function updateUser(companyId, targetUserId, body) {
    const { name, permissions, status } = body;

    // First verify user belongs to the same company
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_users",
        Key: { userId: targetUserId }
    }));

    if (!existing.Item || existing.Item.companyId !== companyId) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "User not found" })
        };
    }

    // Update DynamoDB
    let updateExp = "set updatedAt = :now";
    let expNames = {};
    let expValues = { ":now": new Date().toISOString() };

    if (name) {
        updateExp += ", #name = :name";
        expNames["#name"] = "name";
        expValues[":name"] = name;

        // Also update Cognito
        await cognitoClient.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: existing.Item.email,
            UserAttributes: [{ Name: "name", Value: name }]
        }));
    }

    if (permissions) {
        updateExp += ", #permissions = :p";
        expNames["#permissions"] = "permissions";
        expValues[":p"] = permissions;
    }

    if (status) {
        updateExp += ", #status = :s";
        expNames["#status"] = "status";
        expValues[":s"] = status;

        if (status === "INACTIVE") {
            await cognitoClient.send(new AdminDisableUserCommand({ UserPoolId: userPoolId, Username: existing.Item.email }));
        } else if (status === "ACTIVE") {
            await cognitoClient.send(new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: existing.Item.email }));
        }
    }

    await docClient.send(new UpdateCommand({
        TableName: "gadash_users",
        Key: { userId: targetUserId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: Object.keys(expNames).length > 0 ? expNames : undefined,
        ExpressionAttributeValues: expValues
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "User updated successfully" })
    };
}


/**
 * Delete user from Cognito and DynamoDB
 */
async function deleteUser(companyId, targetUserId, requesterUserId) {
    if (targetUserId === requesterUserId) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "You cannot delete yourself" })
        };
    }

    // Verify ownership
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_users",
        Key: { userId: targetUserId }
    }));

    if (!existing.Item || existing.Item.companyId !== companyId) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "User not found" })
        };
    }



    // 1. Delete from Cognito
    await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: existing.Item.email
    }));

    // 2. Delete from DynamoDB
    await docClient.send(new DeleteCommand({
        TableName: "gadash_users",
        Key: { userId: targetUserId }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "User deleted successfully" })
    };
}

