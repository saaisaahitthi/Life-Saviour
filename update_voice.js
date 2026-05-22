const fs = require('fs');
const p = 'client/src/i18n/translations.js';
let content = fs.readFileSync(p, 'utf8');

const newEn = `
    // Voice Assistant
    voiceAssistant: 'Voice Emergency Assistant',
    listening: 'Listening',
    voicePlaceholder: '"I am having chest pain, please send help..."',
    analyzeAutoFill: 'Analyze & Auto-Fill',
    cancel: 'Cancel',`;

const newHi = `
    // Voice Assistant
    voiceAssistant: 'आवाज आपातकालीन सहायक',
    listening: 'सुन रहा है',
    voicePlaceholder: '"मुझे सीने में दर्द हो रहा है, कृपया मदद भेजें..."',
    analyzeAutoFill: 'विश्लेषण करें और ऑटो-फिल करें',
    cancel: 'रद्द करें',`;

const newTe = `
    // Voice Assistant
    voiceAssistant: 'వాయిస్ ఎమర్జెన్సీ అసిస్టెంట్',
    listening: 'వింటుంది',
    voicePlaceholder: '"నాకు ఛాతీ నొప్పిగా ఉంది, దయచేసి సహాయం పంపండి..."',
    analyzeAutoFill: 'విశ్లేషించండి & ఆటో-ఫిల్ చేయండి',
    cancel: 'రద్దు చేయండి',`;

content = content.replace(/(en:\s*\{)/, '$1' + newEn);
content = content.replace(/(hi:\s*\{)/, '$1' + newHi);
content = content.replace(/(te:\s*\{)/, '$1' + newTe);

fs.writeFileSync(p, content);

let va = fs.readFileSync('client/src/components/VoiceEmergencyAssistant.jsx', 'utf8');
if (!va.includes('useLanguage')) {
    va = va.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
    va = va.replace("const VoiceEmergencyAssistant = ({ onTranscriptionComplete }) => {", "const VoiceEmergencyAssistant = ({ onTranscriptionComplete }) => {\n  const { t } = useLanguage();");
}
va = va.replace(/>Voice Emergency Assistant</g, ">{t('voiceAssistant')}<");
va = va.replace(/>Listening</g, ">{t('listening')}<");
va = va.replace(/>"I am having chest pain, please send help\.\.\."</g, ">{t('voicePlaceholder')}<");
va = va.replace(/>\s*Analyze & Auto-Fill\s*</g, ">{t('analyzeAutoFill')}<");
va = va.replace(/>\s*Cancel\s*</g, ">{t('cancel')}<");
fs.writeFileSync('client/src/components/VoiceEmergencyAssistant.jsx', va);

console.log('VoiceEmergencyAssistant updated.');
