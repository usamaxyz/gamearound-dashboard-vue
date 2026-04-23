import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const region = "eu-central-1";
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PATCH,DELETE"
};

export const handler = async (event) => {
    console.log("JSON Templates Event:", JSON.stringify(event, null, 2));

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

        // RBAC Enforcement (manage_json_templates)
        const userRes = await docClient.send(new GetCommand({
            TableName: "gadash_users",
            Key: { userId: requesterUserId }
        }));

        const permissions = userRes.Item?.permissions || [];
        if (!permissions.includes("manage_json_templates")) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: You do not have permission to manage json templates" })
            };
        }

        const method = event.httpMethod;
        const resource = event.resource;
        const templateIdParam = event.pathParameters?.templateId;

        // Routing
        if (method === "GET" && (resource === "/json-templates" || resource === "/json-templates/")) {
            return await listTemplates(requesterCompanyId);
        }

        if (method === "GET" && resource === "/json-templates/{templateId}" && templateIdParam) {
            return await getTemplate(requesterCompanyId, templateIdParam);
        }

        if (method === "POST" && (resource === "/json-templates" || resource === "/json-templates/")) {
            return await createTemplate(requesterCompanyId, JSON.parse(event.body || "{}"));
        }

        if (method === "PATCH" && resource === "/json-templates/{templateId}" && templateIdParam) {
            return await updateTemplate(requesterCompanyId, templateIdParam, JSON.parse(event.body || "{}"));
        }

        if (method === "DELETE" && resource === "/json-templates/{templateId}" && templateIdParam) {
            return await deleteTemplate(requesterCompanyId, templateIdParam);
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in JSON templates lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};

async function listTemplates(companyId) {
    const data = await docClient.send(new QueryCommand({
        TableName: "gadash_json_templates",
        KeyConditionExpression: "companyId = :cid",
        ExpressionAttributeValues: {
            ":cid": companyId
        }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ templates: data.Items })
    };
}

async function getTemplate(companyId, templateId) {
    const data = await docClient.send(new GetCommand({
        TableName: "gadash_json_templates",
        Key: { companyId, templateId }
    }));

    if (!data.Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Template not found" })
        };
    }

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ template: data.Item })
    };
}

async function createTemplate(companyId, body) {
    const { name, attributes } = body;

    if (!name) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Name is required" })
        };
    }

    const templateItem = {
        companyId,
        templateId: randomUUID(),
        name,
        attributes: attributes || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
        TableName: "gadash_json_templates",
        Item: templateItem
    }));

    return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Template created successfully", template: templateItem })
    };
}

async function updateTemplate(companyId, templateId, body) {
    const { name, attributes } = body;

    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_json_templates",
        Key: { companyId, templateId }
    }));

    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Template not found" })
        };
    }

    let updateExp = "set updatedAt = :now";
    let expNames = {};
    let expValues = { ":now": new Date().toISOString() };

    if (name !== undefined) {
        updateExp += ", #name = :name";
        expNames["#name"] = "name";
        expValues[":name"] = name;
    }

    if (attributes !== undefined) {
        updateExp += ", #attr = :attr";
        expNames["#attr"] = "attributes";
        expValues[":attr"] = attributes;
    }

    await docClient.send(new UpdateCommand({
        TableName: "gadash_json_templates",
        Key: { companyId, templateId },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: Object.keys(expNames).length > 0 ? expNames : undefined,
        ExpressionAttributeValues: expValues
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Template updated successfully" })
    };
}

async function deleteTemplate(companyId, templateId) {
    const existing = await docClient.send(new GetCommand({
        TableName: "gadash_json_templates",
        Key: { companyId, templateId }
    }));

    if (!existing.Item) {
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Template not found" })
        };
    }

    await docClient.send(new DeleteCommand({
        TableName: "gadash_json_templates",
        Key: { companyId, templateId }
    }));

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Template deleted successfully" })
    };
}
