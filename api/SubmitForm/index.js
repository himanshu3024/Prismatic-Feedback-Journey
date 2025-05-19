const { CosmosClient } = require("@azure/cosmos");

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

        // Initialize Cosmos DB client
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });

        const database = client.database("FeedbackDB");
        const container = database.container("Feedback");

        // Create feedback item
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

        // Upsert to Cosmos DB
        await container.items.upsert(feedbackItem);

        context.res = {
            status: 200,
            body: { message: 'Feedback successfully stored' },
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        context.log.error('Error processing feedback:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' },
            headers: { 'Content-Type': 'application/json' }
        };
    }
};

const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    context.log('Form submission received');

    try {
        // Parse the incoming form data (assuming JSON)
        const formData = req.body;

        // Convert form data to JSON string
        const content = JSON.stringify(formData);

        // Generate a unique blob name using timestamp
        const blobName = `form-${Date.now()}.json`;

        // Get the connection string from environment variables
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;

        // Create the BlobServiceClient object
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

        // Get a reference to the container (e.g., 'formdata')
        const containerName = "formdata";
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // Create container if it doesn't exist (safe call)
        await containerClient.createIfNotExists({
            access: 'private'
        });

        // Get a block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload the content
        await blockBlobClient.upload(content, content.length);

        context.res = {
            status: 200,
            body: { message: "Form data uploaded successfully." }
        };

    } catch (error) {
        context.log.error("Error uploading form data:", error);
        context.res = {
            status: 500,
            body: { error: "Error uploading form data." }
        };
    }
};
