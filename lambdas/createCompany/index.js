import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const region = "eu-central-1";
const userPoolId = "eu-central-1_bT03Gs2dg";

const cognitoClient = new CognitoIdentityProviderClient({ region });
const ddbClient = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * create_company Lambda
 * 1. Creates a company named "Gamearound" in gadash_companies
 * 2. Creates a user "usama@gamearound.com" in Cognito
 * 3. Sets a permanent password for the user
 * 4. Syncs the user to gadash_users table
 */
export const handler = async (event) => {
    console.log("CreateCompany Event:", JSON.stringify(event, null, 2));

    const companyName = "Gamearound";
    const userEmail = "usama@gamearound.com";
    const password = "Aa12345678@";

    try {
        // 1. Generate IDs
        const companyId = randomUUID();
        const createdAt = new Date().toISOString();

        // 2. Create Company in DynamoDB
        console.log(`Creating company: ${companyName} (${companyId})`);
        await docClient.send(new PutCommand({
            TableName: "gadash_companies",
            Item: {
                companyId: companyId,
                name: companyName,
                createdAt: createdAt,
                updatedAt: createdAt
            }
        }));

        // 3. Create User in Cognito
        console.log(`Creating user in Cognito: ${userEmail}`);
        let userId;
        try {
            const cognitoRes = await cognitoClient.send(new AdminCreateUserCommand({
                UserPoolId: userPoolId,
                Username: userEmail,
                UserAttributes: [
                    { Name: "email", Value: userEmail },
                    { Name: "email_verified", Value: "true" },
                    { Name: "custom:company_id", Value: companyId }
                ],
                MessageAction: "SUPPRESS" // Don't send welcome email since we set password manually
            }));
            userId = cognitoRes.User.Attributes.find(a => a.Name === "sub").Value;
        } catch (err) {
            if (err.name === "UsernameExistsException") {
                console.log(`User ${userEmail} already exists. Fetching existing user details.`);
                const existingUser = await cognitoClient.send(new AdminGetUserCommand({
                    UserPoolId: userPoolId,
                    Username: userEmail
                }));
                userId = existingUser.UserAttributes.find(a => a.Name === "sub").Value;
            } else {
                throw err;
            }
        }

        // 4. Set Permanent Password
        console.log(`Setting permanent password for user: ${userId}`);
        await cognitoClient.send(new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: userEmail,
            Password: password,
            Permanent: true
        }));

        // 5. Create User in DynamoDB (gadash_users)
        console.log(`Creating user in DynamoDB: ${userId}`);
        await docClient.send(new PutCommand({
            TableName: "gadash_users",
            Item: {
                userId: userId,
                companyId: companyId,
                email: userEmail,
                permissions: ["admin"],
                createdAt: createdAt,
                updatedAt: createdAt,
                status: "ACTIVE"
            }
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Company and Admin User created successfully",
                companyId: companyId,
                userId: userId
            })
        };

    } catch (err) {
        console.error("Error in create_company:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to create company and user",
                error: err.message
            })
        };
    }
};
