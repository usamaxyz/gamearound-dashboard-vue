import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const region = "eu-central-1";
const s3Client = new S3Client({ region });
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
};

const BUCKET_NAME = "gamearound-platform";

export const handler = async (event) => {
    console.log("Assets Event:", JSON.stringify(event, null, 2));

    try {
        const authorizerClaims = event.requestContext?.authorizer?.claims;
        const requesterCompanyId = authorizerClaims?.['custom:company_id'];
        
        if (!requesterCompanyId) {
            return {
                statusCode: 403,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Forbidden: Missing company context" })
            };
        }

        const method = event.httpMethod;
        const resource = event.resource;

        if (method === "POST" && resource === "/assets/upload") {
            const body = JSON.parse(event.body || "{}");
            const { gameId, category, recordId, fileName, contentType } = body;

            if (!gameId || !category || !recordId || !fileName || !contentType) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: "Missing required fields: gameId, category, recordId, fileName, contentType" })
                };
            }

            // Verify the game belongs to the requester's company
            const gameRes = await docClient.send(new GetCommand({
                TableName: "gadash_games",
                Key: { gameId: gameId }
            }));

            if (!gameRes.Item || gameRes.Item.companyId !== requesterCompanyId) {
                return {
                    statusCode: 403,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: "Forbidden: You do not own this game" })
                };
            }

            // Path pattern: /assets/{gameId}/{category}/{recordId}_{fileName}
            // Category can be e.g. "UI/Currency", "Music", etc.
            const s3Key = `assets/${gameId}/${category}/${recordId}_${fileName}`;
            
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: s3Key,
                ContentType: contentType
            });

            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            const finalUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ uploadUrl, finalUrl, s3Key })
            };
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Route not found" })
        };

    } catch (err) {
        console.error("Error in assets lambda:", err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal server error", error: err.message })
        };
    }
};
