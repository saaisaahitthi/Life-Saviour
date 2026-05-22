require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_actual_gemini_api_key_here') {
    console.error('❌ Error: GEMINI_API_KEY is either missing or still set to the placeholder in your .env file.');
    return;
  }

  console.log('Testing Gemini API with key starting with:', apiKey.substring(0, 5) + '...', 'Length:', apiKey.length);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Say "Gemini is active and working!"');
    const response = await result.response;
    console.log('✅ Success! Response:', response.text());
  } catch (error) {
    console.error('❌ API Error with gemini-1.5-flash:', error.message);
    console.log('Retrying with gemini-pro...');
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Say "Gemini Pro is active and working!"');
      const response = await result.response;
      console.log('✅ Success with gemini-pro! Response:', response.text());
    } catch (err2) {
      console.error('❌ API Error with gemini-pro:', err2.message);
    }
  }
}

testGemini();
