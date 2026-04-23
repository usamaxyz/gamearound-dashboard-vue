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
    console.log("Config Catalog Event:", JSON.stringify(event, null, 2));

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

        // 1. RBAC Enforcement (manage_config_catalog)
        const userRes = await docClient.send(new GetCommand({
            TableName: "gadash_users",
            Key: { userId: requesterUserId }
        }));

        const permissions = userRes.Item?.permissions || [];
        if (!permissions.includes("manage_config_catalog")) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: You do not have permission to manage config catalog" })
            };
        }

        const method = event.httpMethod;
        const resource = event.resource;
        const gameIdParam = event.pathParameters?.gameId;
        const categoryParam = event.pathParameters?.category;
        const itemIdParam = event.pathParameters?.itemId;

        // 2. Routing
        if (method === "GET" && resource === "/config-catalog/{gameId}" && gameIdParam) {
            return await listCatalog(requesterCompanyId, gameIdParam);
        }

        if (method === "POST" && resource === "/config-catalog/{gameId}" && gameIdParam) {
            return await createCatalogItem(requesterCompanyId, gameIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "PATCH" && resource === "/config-catalog/{gameId}/{category}/{itemId}" && gameIdParam && categoryParam && itemIdParam) {
            return await updateCatalogItem(requesterCompanyId, gameIdParam, categoryParam, itemIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "DELETE" && resource === "/config-catalog/{gameId}/{category}/{itemId}" && gameIdParam && categoryParam && itemIdParam) {
            return await deleteCatalogItem(requesterCompanyId, gameIdParam, categoryParam, itemIdParam);
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in config catalog lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};

/**
 * List catalog items for a specific game, verifying ownership
 */
async function listCatalog(companyId, gameId) {
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

    // Use GSI on gameid to fetch items
    const data = await docClient.send(new QueryCommand({
        TableName: "gap_config_catalog",
        IndexName: "gameidIndex2", // Assuming a GSI on gameid
        KeyConditionExpression: "gameid = :gid",
        ExpressionAttributeValues: {
            ":gid": gameId
        }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ items: data.Items })
    };
}

/**
 * Create a new catalog item
 */
async function createCatalogItem(companyId, gameIdFromPath, body) {
    const {
        category, itemid, assetId, bundle, currency, description,
        imageUrl, limitedAmount, maxTime, maxUses, name, payload,
        price, stackable, tradable, inAppPurchase
    } = body;
    const gameid = gameIdFromPath;

    if (!gameid || !category || !itemid || !name) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Game ID, Category, Item ID, and Name are required" })
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

    // Check for existing (category + itemid)
    const existing = await docClient.send(new GetCommand({
        TableName: "gap_config_catalog",
        Key: { category, itemid }
    }));

    if (existing.Item) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Item ID already exists in this category" })
        };
    }

    const catalogItem = {
        gameid,
        category,
        itemid,
        assetId: assetId || "",
        bundle: bundle !== undefined ? bundle : "",
        currency: currency || "",
        description: description || "",
        imageUrl: imageUrl || "",
        limitedAmount: limitedAmount !== undefined ? Number(limitedAmount) : -1,
        maxTime: maxTime !== undefined ? Number(maxTime) : 0,
        maxUses: maxUses !== undefined ? Number(maxUses) : 0,
        name,
        payload: payload !== undefined ? payload : "",
        price: price !== undefined ? Number(price) : 0,
        stackable: String(stackable || "false"),
        tradable: String(tradable || "false"),
        inAppPurchase: String(inAppPurchase || "false"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
        TableName: "gap_config_catalog",
        Item: catalogItem
    }));

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Catalog item created successfully", item: catalogItem })
    };
}

/**
 * Update catalog item
 */
async function updateCatalogItem(companyId, gameId, category, itemid, body) {
    const {
        assetId, bundle, currency, description, imageUrl, limitedAmount,
        maxTime, maxUses, name, payload, price, stackable, tradable, inAppPurchase
    } = body;

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
        TableName: "gap_config_catalog",
        Key: { category, itemid }
    }));

    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Item not found" })
        };
    }

    let updateExp = "set updatedAt = :now";
    let expNames = {};
    let expValues = { ":now": new Date().toISOString() };

    const fields = {
        assetId, bundle, currency, description, imageUrl, limitedAmount,
        maxTime, maxUses, name, payload, price, stackable, tradable, inAppPurchase
    };

    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            updateExp += `, #${key} = :${key}`;
            expNames[`#${key}`] = key;
            expValues[`:${key}`] = (key === 'price' || key === 'limitedAmount' || key === 'maxTime' || key === 'maxUses') ? Number(value) : String(value);
        }
    }

    await docClient.send(new UpdateCommand({
        TableName: "gap_config_catalog",
        Key: { category, itemid },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: expValues
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Catalog item updated successfully" })
    };
}

/**
 * Delete catalog item
 */
async function deleteCatalogItem(companyId, gameId, category, itemid) {
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
        TableName: "gap_config_catalog",
        Key: { category, itemid }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Catalog item deleted successfully" })
    };
}
