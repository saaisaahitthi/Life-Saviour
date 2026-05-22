require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Fetching available models...');
    
    // In newer SDK versions, we use genAI.getGenerativeModel({ model: "..." })
    // But to list models, we usually need to fetch from the API directly or use a specific method if available.
    // The SDK doesn't always have a direct "listModels" but let's try a common one.
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('hi');
    console.log('✅ Basic test passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPotential causes:');
    console.log('1. The API key might not have "Generative Language API" enabled.');
    console.log('2. The API key might be restricted by region.');
    console.log('3. The model name "gemini-1.5-flash" might not be available for this specific key.');
  }
}

listModels();
