const knowledge = require('../../data/knowledge-base.json');

exports.handler = async (event, context) => {
  // Headers para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { action, query, message } = JSON.parse(event.body || '{}');
    
    switch(action) {
      case 'get-key':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            apiKey: process.env.GROQ_API_KEY 
          })
        };
      
      case 'search-knowledge':
        const results = searchKnowledge(query, knowledge);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ results })
        };
      
      case 'get-context':
        const context = getRelevantContext(message, knowledge);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ context })
        };
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Ação não reconhecida' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function searchKnowledge(query, kb) {
  const keywords = query.toLowerCase().split(' ');
  const results = [];
  
  for (const [key, item] of Object.entries(kb)) {
    let score = 0;
    const searchText = `${item.titulo} ${item.conteudo} ${item.tags?.join(' ')}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (searchText.includes(keyword)) {
        score += searchText.split(keyword).length - 1;
      }
    });
    
    if (score > 0) {
      results.push({ 
        id: key,
        ...item, 
        relevance: score 
      });
    }
  }
  
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3); // Top 3 resultados
}

function getRelevantContext(message, kb) {
  const results = searchKnowledge(message, kb);
  
  if (results.length === 0) return '';
  
  let context = '\n\n=== INFORMAÇÕES DA BASE DE CONHECIMENTO ===\n';
  
  results.forEach((item, index) => {
    context += `\n${index + 1}. ${item.titulo}:\n${item.conteudo}\n`;
  });
  
  context += '\n=== FIM DA BASE DE CONHECIMENTO ===\n';
  context += 'Use essas informações para dar uma resposta mais precisa e completa.\n';
  
  return context;
}
