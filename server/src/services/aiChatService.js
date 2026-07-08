const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash';

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu'
};

/**
 * Builds the full system prompt based on language
 */
const buildSystemPrompt = (language = 'en') => {
  const langName = LANGUAGE_NAMES[language] || 'English';
  return `You are "Life Saviour AI", a professional emergency medical dispatcher assistant.
Your role is to calmly assist a patient who has just reported an emergency while help is being dispatched.

CRITICAL LANGUAGE RULE: You MUST respond ENTIRELY in ${langName}. Every single word in the "response" field must be in ${langName}. Do not mix languages.

Conversation Guidelines:
- Be calm, empathetic, conversational, and reassuring. Avoid sounding like an automated script.
- Adapt your questions based on the patient's previous answers. Do not repeat questions if they have already been answered or if the patient expresses confusion or denial.
- Gather critical info dynamically: breathing status, consciousness, severe pain, location, or visible injuries.
- If life-threatening (chest pain, unconscious, severe bleeding): give immediate first-aid steps AND set shouldEscalate to true.
- Keep responses concise and clear (1-3 sentences max).
- ALWAYS end your response with a clarifying question to keep the patient engaged and gather more information.
- Always acknowledge what the patient said naturally before continuing.
- Do NOT diagnose conditions.

You must reply with ONLY your spoken response to the patient. Do not add any JSON, markdown, or metadata.`;
};

/**
 * Safely extract JSON from model output that may contain thinking blocks or markdown
 */
const extractJSON = (text) => {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch (_) {}

  // Strip markdown code fences
  const stripped = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {}

  // Find JSON object using regex (handles thinking model output)
  const match = text.match(/\{[\s\S]*"response"[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  // Last resort: extract response field manually
  const responseMatch = text.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (responseMatch) {
    return {
      response: responseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
      shouldEscalate: text.toLowerCase().includes('critical') || text.toLowerCase().includes('escalate'),
      summary: 'Extracted from partial response',
      newSeverity: text.toLowerCase().includes('critical') ? 'critical' : null
    };
  }

  // If text looks like a direct message (no JSON at all), use it as-is
  if (text.length > 10 && !text.includes('{')) {
    return {
      response: text.trim(),
      shouldEscalate: false,
      summary: 'AI response extracted',
      newSeverity: null
    };
  }

  return null;
};

const getChatResponse = async (history, message, context, language = 'en') => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') throw new Error('Missing API Key');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: buildSystemPrompt(language),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    });

    // Build valid chat history - must start with user, alternate user/model
    const rawHistory = history
      .filter(h => h.content && !h.content.includes('{ "response": "') && !h.content.includes('in English? Yes')) // filter out previous broken hallucinations
      .map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.content || '' }]
      }))
      .filter(h => h.parts[0].text.trim() !== '');

    // Ensure history starts with 'user' (Gemini requirement)
    const cleanHistory = [];
    let lastRole = null;
    for (const h of rawHistory.slice(-10)) {
      if (h.role === lastRole) continue; // skip consecutive same-role messages
      cleanHistory.push(h);
      lastRole = h.role;
    }
    // Remove trailing model message so the new user message comes next
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'model') {
      cleanHistory.pop();
    }
    // Remove leading model message
    if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
      cleanHistory.shift();
    }

    const userPrompt = message
      ? `Patient message: "${message}"\n\nEmergency context: ${context}`
      : `Emergency context: ${context}\n\nThe patient has just connected. Greet them and ask about their immediate situation.`;

    let responseText = '';

    if (cleanHistory.length > 0) {
      const chat = model.startChat({ history: cleanHistory });
      const result = await chat.sendMessage(userPrompt);
      responseText = result.response.text();
    } else {
      // No history - use generateContent directly
      const result = await model.generateContent(userPrompt);
      responseText = result.response.text();
    }

    console.log('[AI Raw Response]:', responseText.substring(0, 300));

    // Determine escalation based on keywords in the text
    const textLower = responseText.toLowerCase();
    const shouldEscalate = textLower.includes('critical') || textLower.includes('emergency room') || textLower.includes('ambulance');

    return {
      response: responseText.trim(),
      shouldEscalate: shouldEscalate,
      summary: 'Ongoing patient chat',
      newSeverity: shouldEscalate ? 'critical' : null
    };
  } catch (error) {
    console.error('[AI Chat Error]:', error.message);
    const langName = LANGUAGE_NAMES[language] || 'English';
    const fallbacks = {
      en: "I'm here to help. Please describe your symptoms clearly.",
      hi: "मैं यहाँ मदद करने के लिए हूँ। कृपया अपने लक्षण बताएं।",
      te: "నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మీ లక్షణాలు వివరించండి."
    };
    return {
      response: fallbacks[language] || fallbacks.en,
      shouldEscalate: false,
      summary: 'AI fallback active'
    };
  }
};

const generateSummary = async (history, emergencyData = {}, wearableData = null, timelineEvents = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return 'Summary unavailable.';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const wearableSection = wearableData ? `

--- CONNECTED HEALTH DEVICE DATA ---
Device: ${wearableData.deviceName || 'Unknown Device'}
Heart Rate: ${wearableData.heartRate ? `${wearableData.heartRate} BPM` : 'N/A'}
Blood Oxygen (SpO2): ${wearableData.bloodOxygen ? `${wearableData.bloodOxygen}%` : 'N/A'}
Blood Pressure: ${wearableData.bloodPressure || 'N/A'}
Temperature: ${wearableData.temperature ? `${wearableData.temperature}°C` : 'N/A'}
Stress Level: ${wearableData.stressLevel ? `${wearableData.stressLevel}/100` : 'N/A'}
Steps Today: ${wearableData.steps || 'N/A'}
Note: These are REAL-TIME readings from the patient's wearable health device at the time of the emergency.
---` : '';

    const emergencySection = emergencyData.symptoms ? `

--- EMERGENCY REPORT DATA ---
Symptoms: ${emergencyData.symptoms}
Reported Severity: ${emergencyData.severity}
Age: ${emergencyData.age}
Blood Group: ${emergencyData.bloodGroup}
Location: ${emergencyData.location}
Transport Type: ${emergencyData.transportType}
Triage Inputs:
  - Pain Level: ${emergencyData.triageInputs?.painLevel}/10
  - Breathing Difficulty: ${emergencyData.triageInputs?.breathingDifficulty}/10
  - Consciousness: ${emergencyData.triageInputs?.consciousnessState}
Additional Notes: ${emergencyData.additionalNotes || 'None'}
---` : '';

    const timelineSection = timelineEvents && timelineEvents.length > 0 ? `

--- TIMELINE UPDATES ---
${timelineEvents.map(e => `[${new Date(e.createdAt).toLocaleTimeString()}] ${e.title}: ${e.description}`).join('\n')}
---` : '';

    const aiTriageSection = emergencyData.aiTriage?.category ? `

--- AI TRIAGE ANALYSIS ---
Category: ${emergencyData.aiTriage.category}
Priority: ${emergencyData.aiTriage.priorityLevel}
Recommended Department: ${emergencyData.aiTriage.recommendedDepartment}
Severity Score: ${emergencyData.aiTriage.severityScore}
Summary: ${emergencyData.aiTriage.analysisSummary}
---` : '';

    const prompt = `You are an expert emergency medical AI preparing a complete clinical handoff summary for the attending doctor.

Please provide a concise, structured medical summary from all available data below.

Sections to cover:
1. **Chief Complaint**: Primary reason for emergency
2. **Key Symptoms & Vital Signs**: From patient report and wearable device (if available)
3. **Risk Flags**: Any critical values or red flags detected
4. **Recommended Urgency**: Based on all data
5. **Timeline Overview**: Key events since the emergency started
6. **Suggested Actions**: Immediate steps the doctor should take${emergencySection}${aiTriageSection}${wearableSection}${timelineSection}

--- AI TRIAGE CONVERSATION ---
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return 'Summary unavailable.';
  }
};

module.exports = { getChatResponse, generateSummary };
