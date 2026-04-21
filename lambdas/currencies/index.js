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
    console.log("Currencies Event:", JSON.stringify(event, null, 2));

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

        // 1. RBAC Enforcement (manage_currencies)
        // We check the gadash_users table for the requester's permissions
        const userRes = await docClient.send(new GetCommand({
            TableName: "gadash_users",
            Key: { userId: requesterUserId }
        }));

        const permissions = userRes.Item?.permissions || [];
        if (!permissions.includes("manage_currencies")) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: You do not have permission to manage currencies" })
            };
        }

        const method = event.httpMethod;
        const resource = event.resource;
        const gameIdParam = event.pathParameters?.gameId;
        const currencyIdParam = event.pathParameters?.currencyId;

        // 2. Routing
        if (method === "GET" && resource === "/currencies/{gameId}" && gameIdParam) {
            return await listCurrencies(requesterCompanyId, gameIdParam);
        }

        if (method === "POST" && resource === "/currencies/{gameId}" && gameIdParam) {
            return await createCurrency(requesterCompanyId, gameIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "PATCH" && resource === "/currencies/{gameId}/{currencyId}" && gameIdParam && currencyIdParam) {
            return await updateCurrency(requesterCompanyId, gameIdParam, currencyIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "DELETE" && resource === "/currencies/{gameId}/{currencyId}" && gameIdParam && currencyIdParam) {
            return await deleteCurrency(requesterCompanyId, gameIdParam, currencyIdParam);
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in currencies lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};

/**
 * List currencies for a specific game, verifying ownership
 */
async function listCurrencies(companyId, gameId) {
    // Verify game ownership
    const gameCheck = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (!gameCheck.Item || gameCheck.Item.companyId !== companyId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Forbidden: You do not own this game" })
        };
    }

    const data = await docClient.send(new QueryCommand({
        TableName: "gap_config_currency",
        KeyConditionExpression: "gameid = :gid",
        ExpressionAttributeValues: {
            ":gid": gameId
        }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ currencies: data.Items })
    };
}

/**
 * Create a new currency
 */
async function createCurrency(companyId, gameIdFromPath, body) {
    const { id, name, launchDeposit, assetUrl, imageUrl } = body;
    const gameid = gameIdFromPath; // Use gameId from path

    if (!gameid || !id || !name || launchDeposit === undefined || launchDeposit === null) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game ID, Currency ID, Name, and Launch Deposit are required" })
        };
    }

    // Verify game ownership
    const gameCheck = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameid }
    }));

    if (!gameCheck.Item || gameCheck.Item.companyId !== companyId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Forbidden: You do not own this game" })
        };
    }

    // Check for existing
    const existing = await docClient.send(new GetCommand({
        TableName: "gap_config_currency",
        Key: { gameid: gameid, id: id }
    }));

    if (existing.Item) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Currency ID already exists for this game" })
        };
    }

    // Check for name uniqueness per game
    const allCurrencies = await docClient.send(new QueryCommand({
        TableName: "gap_config_currency",
        KeyConditionExpression: "gameid = :gid",
        ExpressionAttributeValues: { ":gid": gameid }
    }));

    const nameExists = allCurrencies.Items?.some(item => 
        item.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "A currency with this name already exists for this game" })
        };
    }

    const currencyItem = {
        gameid,
        id,
        name,
        launchDeposit: launchDeposit ? Number(launchDeposit) : 0,
        assetUrl: assetUrl || "",
        imageUrl: imageUrl || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
        TableName: "gap_config_currency",
        Item: currencyItem
    }));

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Currency created successfully", currency: currencyItem })
    };
}

/**
 * Update currency
 */
async function updateCurrency(companyId, gameId, id, body) {
    const { name, launchDeposit, assetUrl, imageUrl } = body;

    if (name === "" || launchDeposit === undefined) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Name and Launch Deposit cannot be empty" })
        };
    }

    // Verify game ownership
    const gameCheck = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (!gameCheck.Item || gameCheck.Item.companyId !== companyId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Forbidden: You do not own this game" })
        };
    }

    // Verify existence
    const existing = await docClient.send(new GetCommand({
        TableName: "gap_config_currency",
        Key: { gameid: gameId, id: id }
    }));

    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Currency not found" })
        };
    }

    // Check for name uniqueness if name is changing
    if (name && name.toLowerCase() !== existing.Item.name.toLowerCase()) {
        const allCurrencies = await docClient.send(new QueryCommand({
            TableName: "gap_config_currency",
            KeyConditionExpression: "gameid = :gid",
            ExpressionAttributeValues: { ":gid": gameId }
        }));

        const nameExists = allCurrencies.Items?.some(item => 
            item.id !== id && item.name.toLowerCase() === name.toLowerCase()
        );

        if (nameExists) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "A currency with this name already exists for this game" })
            };
        }
    }

    let updateExp = "set updatedAt = :now";
    let expNames = {};
    let expValues = { ":now": new Date().toISOString() };

    if (name) {
        updateExp += ", #name = :name";
        expNames["#name"] = "name";
        expValues[":name"] = name;
    }
    if (launchDeposit !== undefined) {
        updateExp += ", launchDeposit = :ld";
        expValues[":ld"] = Number(launchDeposit);
    }
    if (assetUrl !== undefined) {
        updateExp += ", assetUrl = :au";
        expValues[":au"] = assetUrl;
    }
    if (imageUrl !== undefined) {
        updateExp += ", imageUrl = :iu";
        expValues[":iu"] = imageUrl;
    }

    await docClient.send(new UpdateCommand({
        TableName: "gap_config_currency",
        Key: { gameid: gameId, id: id },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: Object.keys(expNames).length > 0 ? expNames : undefined,
        ExpressionAttributeValues: expValues
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Currency updated successfully" })
    };
}

/**
 * Delete currency
 */
async function deleteCurrency(companyId, gameId, id) {
    // Verify game ownership
    const gameCheck = await docClient.send(new GetCommand({
        TableName: "gadash_games",
        Key: { gameId: gameId }
    }));

    if (!gameCheck.Item || gameCheck.Item.companyId !== companyId) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Forbidden: You do not own this game" })
        };
    }

    await docClient.send(new DeleteCommand({
        TableName: "gap_config_currency",
        Key: { gameid: gameId, id: id }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Currency deleted successfully" })
    };
}
