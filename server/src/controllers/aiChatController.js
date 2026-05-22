const AIChat = require('../models/AIChat');
const Emergency = require('../models/Emergency');
const aiChatService = require('../services/aiChatService');

exports.sendMessage = async (req, res) => {
  try {
    const { emergencyId, message, language = 'en' } = req.body;
    const userId = req.user._id;

    let chat = await AIChat.findOne({ emergencyId, isActive: true });
    
    if (!chat) {
      chat = await AIChat.create({
        emergencyId,
        patientId: userId,
        messages: []
      });
    }

    const emergency = await Emergency.findById(emergencyId);
    const context = `Symptoms: ${emergency.symptoms}. Severity: ${emergency.severity}. Transport: ${emergency.transportType}.`;

    // Get AI Response
    const aiData = await aiChatService.getChatResponse(chat.messages, message, context, language);
    const aiResponse = aiData.response;

    // Update history
    if (message) {
      chat.messages.push({ role: 'user', content: message });
    }
    chat.messages.push({ role: 'ai', content: aiResponse });

    // Update summary and emergency status
    chat.summary = aiData.summary;
    
    const updateData = { 'aiTriage.chatSummary': chat.summary };
    if (aiData.newSeverity) {
      updateData.severity = aiData.newSeverity;
      updateData['aiTriage.priorityLevel'] = aiData.newSeverity;
    }
    
    await Emergency.findByIdAndUpdate(emergencyId, updateData);
    await chat.save();

    res.json({
      message: aiResponse,
      chat: chat,
      shouldEscalate: aiData.shouldEscalate
    });
  } catch (error) {
    res.status(500).json({ message: 'AI Chat Error', error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chat = await AIChat.findOne({ emergencyId: req.params.emergencyId });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI chat', error: error.message });
  }
};
