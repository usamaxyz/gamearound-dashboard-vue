import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const region = "eu-central-1";
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
    console.log("Starting script to add gameid='mkr' to all config catalog items...");
    
    try {
        let items = [];
        let lastEvaluatedKey = undefined;
        
        // Scan the table to get all items
        do {
            const scanCommand = new ScanCommand({
                TableName: "gap_config_catalog",
                ExclusiveStartKey: lastEvaluatedKey
            });
            
            const response = await docClient.send(scanCommand);
            items = items.concat(response.Items);
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);
        
        console.log(`Found ${items.length} items in total.`);
        let updatedCount = 0;
        
        for (const item of items) {
            // Check if gameid is missing or if we just want to force it to 'mkr'
            if (!item.gameid) {
                console.log(`Updating item [Category: ${item.category}, ItemID: ${item.itemid}] with gameid=mkr`);
                
                await docClient.send(new UpdateCommand({
                    TableName: "gap_config_catalog",
                    Key: {
                        category: item.category,
                        itemid: item.itemid
                    },
                    UpdateExpression: "set gameid = :gid",
                    ExpressionAttributeValues: {
                        ":gid": "mkr"
                    }
                }));
                
                updatedCount++;
            }
        }
        
        console.log(`Finished updating. Total items updated: ${updatedCount}`);
        return { statusCode: 200, body: JSON.stringify({ updatedCount }) };
    } catch (err) {
        console.error("Error updating items:", err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
