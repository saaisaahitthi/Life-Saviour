require('dotenv').config();
const https = require('https');

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_actual')) {
    console.error('❌ No valid API key found in .env');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log('🔍 Fetching all models available for your key...');
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const response = JSON.parse(data);
      if (response.error) {
        console.error('❌ API Error:', response.error.message);
        if (response.error.status === 'INVALID_ARGUMENT') {
          console.log('💡 Tip: Your key might be missing the "Generative Language API" permission.');
        }
      } else if (response.models) {
        console.log('✅ Found', response.models.length, 'available models:');
        response.models.forEach(m => {
          console.log(` - ${m.name.split('/').pop()} (${m.displayName})`);
        });
        console.log('\n🚀 Recommended for your project:');
        const flash = response.models.find(m => m.name.includes('gemini-1.5-flash'));
        if (flash) console.log(`Use: "gemini-1.5-flash"`);
        else console.log(`Use: "${response.models[0].name.split('/').pop()}"`);
      } else {
        console.log('❓ No models returned. This key might be restricted or inactive.');
      }
    });
  }).on('error', (err) => {
    console.error('❌ Connection Error:', err.message);
  });
}

listAllModels();
