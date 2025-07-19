exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { action } = JSON.parse(event.body);
        
        if (action === 'get-key') {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    apiKey: process.env.GROQ_API_KEY
                })
            };
        }
        
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid action' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};
