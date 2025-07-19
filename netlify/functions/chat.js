// netlify/functions/chat.js
exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Lidar com preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Só aceitar POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Pegar a API key das variáveis de ambiente
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('GROQ_API_KEY não encontrada nas variáveis de ambiente');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Configuração da API não encontrada' })
      };
    }

    // Parse do body da requisição
    const { messages, maxHistory = 20 } = JSON.parse(event.body);

    // Prompt do sistema para a BarIA
    const systemPrompt = {
      role: 'system',
      content: `Você é a BarIA, uma assistente virtual especializada em cirurgia bariátrica no Brasil. 
      Suas características:
      - Especialista em cirurgia bariátrica e procedimentos relacionados
      - Conhece o sistema de saúde brasileiro (SUS e convênios)
      - Fornece informações precisas sobre pré e pós-operatório
      - Linguagem acolhedora e empática
      - Sempre orienta a buscar profissionais qualificados
      - NÃO faz diagnósticos médicos
      - Foca em educação e suporte emocional
      
      Responda sempre em português brasileiro e mantenha um tom acolhedor.`
    };

    // Prepara o histórico de conversas com o prompt do sistema
    let conversationHistory = [systemPrompt];
    
    // Limita o histórico se necessário
    const limitedMessages = messages.slice(-maxHistory);
    conversationHistory = conversationHistory.concat(limitedMessages);

    // Chama a API da GroqCloud
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // ou 'mixtral-8x7b-32768'
        messages: conversationHistory,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da GroqCloud API:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Erro da API GroqCloud: ${response.status}` })
      };
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: assistantMessage,
        usage: data.usage // Opcional: retornar informações de uso
      })
    };

  } catch (error) {
    console.error('Erro interno:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  }
};
