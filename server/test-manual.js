require('dotenv').config();

async function testManual() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: "Say 'Success'" }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Success! AI said:', data.candidates[0].content.parts[0].text);
    }
  } catch (err) {
    console.error('❌ Fetch Error:', err.message);
  }
}

testManual();
