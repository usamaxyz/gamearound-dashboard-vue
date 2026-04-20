import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = "eu-central-1";
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH,DELETE"
};

export const handler = async (event) => {
    console.log("Games Event:", JSON.stringify(event, null, 2));

    try {
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

        // 1. RBAC Enforcement (Restricted to manage_games)
        const requesterRes = await docClient.send(new GetCommand({
            TableName: "gadash_users",
            Key: { userId: requesterUserId }
        }));
        
        const requesterPermissions = requesterRes.Item?.permissions || [];
        const canManageGames = requesterPermissions.includes("manage_games");

        if (!canManageGames) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: You do not have permission to manage games" })
            };
        }

        const method = event.httpMethod;
        const resource = event.resource;
        const gameIdParam = event.pathParameters?.gameId;

        // 2. Routing
        if (method === "GET" && resource === "/games") {
            return await listGames(requesterCompanyId, event.queryStringParameters);
        }

        if (method === "POST" && resource === "/games") {
            return await createGame(requesterCompanyId, JSON.parse(event.body || "{}"));
        }

        if (method === "PATCH" && resource === "/games/{gameId}" && gameIdParam) {
            return await updateGame(requesterCompanyId, gameIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "DELETE" && resource === "/games/{gameId}" && gameIdParam) {
            return await deleteGame(requesterCompanyId, gameIdParam);
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in games lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};

/**
 * List games for the company
 */
async function listGames(companyId, queryParams) {
    const searchTerm = queryParams?.search;

    let params = {
        TableName: "gadash_games",
        IndexName: "companyIdIndex", // GSI: Partition Key = companyId, Sort Key = createdAt
        KeyConditionExpression: "companyId = :cid",
        ExpressionAttributeValues: {
            ":cid": companyId
        }
    };

    if (searchTerm) {
        params.FilterExpression = "contains(#name, :search) OR contains(gameId, :search)";
        params.ExpressionAttributeNames = { "#name": "name" };
        params.ExpressionAttributeValues[":search"] = searchTerm;
    }

    const data = await docClient.send(new QueryCommand(params));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ games: data.Items })
    };
}

/**
 * Create a new game
 */
async function createGame(companyId, body) {
    const { gameId, name } = body;

    // Validation
    if (!gameId || !name) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game ID and Name are required" })
        };
    }

    // Verify Uniqueness across the table (gameId is Partition Key)
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (existing.Item) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game ID already exists" })
        };
    }

    const createdAt = new Date().toISOString();
    const gameItem = {
        gameId: gameId,
        companyId: companyId,
        name: name,
        createdAt: createdAt,
        updatedAt: createdAt
    };

    await docClient.send(new PutCommand({
        TableName: "gadash_games",
        Item: gameItem
    }));

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Game created successfully", game: gameItem })
    };
}

/**
 * Update an existing game
 */
async function updateGame(companyId, gameId, body) {
    const { name } = body;

    // Verify existence and ownership
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (!existing.Item || existing.Item.companyId !== companyId) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game not found" })
        };
    }

    let updateExp = "set updatedAt = :now";
    let expNames = {};
    let expValues = { ":now": new Date().toISOString() };

    if (name) {
        updateExp += ", #name = :name";
        expNames["#name"] = "name";
        expValues[":name"] = name;
    }

    await docClient.send(new UpdateCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: Object.keys(expNames).length > 0 ? expNames : undefined,
        ExpressionAttributeValues: expValues
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Game updated successfully" })
    };
}

/**
 * Delete a game
 */
async function deleteGame(companyId, gameId) {
    // Verify existence and ownership
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (!existing.Item || existing.Item.companyId !== companyId) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game not found" })
        };
    }

    await docClient.send(new DeleteCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Game deleted successfully" })
    };
}
