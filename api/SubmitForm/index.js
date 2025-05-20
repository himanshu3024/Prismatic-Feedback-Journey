const { CosmosClient } = require("@azure/cosmos");
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Processing feedback form submission');

    try {
        // Validate request method and body
        if (req.method !== 'POST') {
            context.res = {
                status: 405,
                body: { error: 'Method not allowed. Use POST.' },
                headers: { 'Content-Type': 'application/json' }
            };
            return;
        }

        const feedback = req.body;

        // Validate required fields
        if (!feedback.name || !feedback.email || !feedback.feedbackType || !feedback.rating || !feedback.comments || !feedback.timestamp) {
            context.res = {
                status: 400,
                body: { error: 'All fields are required: name, email, feedbackType, rating, comments, timestamp' },
                headers: { 'Content-Type': 'application/json' }
            };
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(feedback.email)) {
            context.res = {
                status: 400,
                body: { error: 'Invalid email format' },
                headers: { 'Content-Type': 'application/json' }
            };
            return;
        }

        // Validate rating (1-5)
        const rating = parseInt(feedback.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            context.res = {
                status: 400,
                body: { error: 'Rating must be a number between 1 and 5' },
                headers: { 'Content-Type': 'application/json' }
            };
            return;
        }

        // === 1. Save to Cosmos DB ===
        const cosmosClient = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });

        const database = cosmosClient.database("FeedbackDB");
        const container = database.container("Feedback");

        const feedbackItem = {
            id: `${feedback.email}_${feedback.timestamp}`,
            partitionKey: feedback.email,
            name: feedback.name,
            email: feedback.email,
            feedbackType: feedback.feedbackType,
            rating: rating,
            comments: feedback.comments,
            timestamp: feedback.timestamp
        };

        await container.items.upsert(feedbackItem);

        // === 2. Upload to Blob Storage ===
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient("formdata");

        await containerClient.createIfNotExists({ access: 'private' });

        const blobName = `form-${Date.now()}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const content = JSON.stringify(feedback);

        await blockBlobClient.upload(content, content.length);

        // Success response
        context.res = {
            status: 200,
            body: { message: 'Feedback successfully stored and uploaded.' },
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        context.log.error("Error processing feedback:", error);
        context.res = {
            status: 500,
            body: { error: "Internal server error." },
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
