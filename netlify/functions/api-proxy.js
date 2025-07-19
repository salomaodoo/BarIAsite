// netlify/functions/api-proxy.js
exports.handler = async (event, context) => {
    // Apenas aceita POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { action, message, systemPrompt } = JSON.parse(event.body);
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Retorna apenas a API key para verificação inicial
        if (action === 'get-key') {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey: 'configured' })
            };
        }

        // Processa mensagens do chat
        if (action === 'chat') {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3-8b-8192',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ response: aiResponse })
            };
        }

        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid action' })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    }
};
