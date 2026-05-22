const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIChat = require('../models/AIChat');
const Emergency = require('../models/Emergency');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async analyzeEmergency(data) {
    const prompt = `
      You are an AI Medical Triage Assistant. Analyze the following emergency case and provide a structured JSON response.
      
      Patient Data:
      Age: ${data.age}
      Symptoms: ${data.symptoms}
      Additional Notes: ${data.notes || 'None'}
      Breathing Difficulty (1-10): ${data.breathingDifficulty}
      Pain Level (1-10): ${data.painLevel}
      Consciousness: ${data.consciousnessState}

      Based on this data, provide a JSON response with the following keys:
      - category: The medical category (e.g., cardiac, trauma, neurological, respiratory, general, orthopedic, pediatric)
      - severityScore: A number from 1 to 10 indicating the severity
      - priorityLevel: One of "low", "medium", "high", "critical"
      - recommendedDepartment: The recommended hospital department
      - analysisSummary: A brief 2-sentence summary of the condition and immediate risks

      JSON response:
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return parsed;
    } catch (error) {
      console.error('AI Analyze Emergency Error:', error);
      return {
        category: 'general',
        severityScore: 5,
        priorityLevel: 'medium',
        recommendedDepartment: 'Emergency',
        analysisSummary: 'AI analysis failed. Requires manual triage.'
      };
    }
  }

  /**
   * Process a message from the patient during triage
   */
  async processTriageMessage(emergencyId, patientId, message) {
    let aiChat = await AIChat.findOne({ emergencyId, patientId, isActive: true });
    
    if (!aiChat) {
      aiChat = new AIChat({ emergencyId, patientId, messages: [] });
    }

    aiChat.messages.push({ role: 'user', content: message });

    const emergency = await Emergency.findById(emergencyId);
    
    const prompt = `
      You are an AI Emergency Medical Assistant for "Life Saviour".
      Current Emergency Context:
      Symptoms: ${emergency.symptoms}
      Reported Severity: ${emergency.severity}
      Triage Inputs: ${JSON.stringify(emergency.triageInputs)}

      Conversation History:
      ${aiChat.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

      Task:
      1. Ask follow-up medical questions to understand the situation better.
      2. Provide basic first-aid guidance if applicable.
      3. If you detect signs of worsening condition (chest pain, difficulty breathing, etc.), mention that you are escalating the priority.
      4. Keep the tone professional, calm, and reassuring.
      5. Respond in a concise manner suitable for a chat interface.

      Format your response as a JSON object with:
      {
        "response": "The message to the patient",
        "shouldEscalate": boolean,
        "newSeverity": "low" | "medium" | "critical" (optional),
        "summary": "Brief summary of gathered info so far"
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      aiChat.messages.push({ role: 'ai', content: parsed.response });
      aiChat.summary = parsed.summary;
      await aiChat.save();

      // Update emergency if escalation is needed
      if (parsed.shouldEscalate || parsed.newSeverity) {
        emergency.severity = parsed.newSeverity || emergency.severity;
        emergency.aiTriage.chatSummary = parsed.summary;
        await emergency.save();
      }

      return parsed;
    } catch (error) {
      console.error('AI Triage Error:', error);
      return {
        response: "I'm processing your information. A doctor will be with you shortly. Please stay calm.",
        shouldEscalate: false,
        summary: "AI processing failed, falling back to manual triage."
      };
    }
  }

  /**
   * Generates a final summary for the doctor
   */
  async generateDoctorSummary(emergencyId) {
    const aiChat = await AIChat.findOne({ emergencyId });
    if (!aiChat) return "No AI triage data available.";

    const prompt = `
      Summarize the following emergency triage conversation for a doctor.
      Highlight:
      - Primary symptoms
      - Vital signs mentioned
      - Red flags detected
      - Patient's current state
      
      Conversation:
      ${aiChat.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
    `;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}

module.exports = new AIService();
