const fs = require('fs');
const p = 'client/src/i18n/translations.js';
let content = fs.readFileSync(p, 'utf8');

const newEn = `
    // Timeline & Video Call
    noEventsRecorded: 'No events recorded yet',
    byActor: 'By',
    calling: 'Calling',
    establishingUplink: 'Establishing secure medical uplink',
    you: 'You',
    encrypted: 'PEER-TO-PEER ENCRYPTED',
    consultationInProgress: 'Medical Consultation in Progress',`;

const newHi = `
    // Timeline & Video Call
    noEventsRecorded: 'अभी तक कोई घटना दर्ज नहीं की गई',
    byActor: 'द्वारा',
    calling: 'कॉल किया जा रहा है',
    establishingUplink: 'सुरक्षित चिकित्सा अपलिंक स्थापित किया जा रहा है',
    you: 'आप',
    encrypted: 'पीयर-टू-पीयर एन्क्रिप्टेड',
    consultationInProgress: 'चिकित्सा परामर्श प्रगति पर है',`;

const newTe = `
    // Timeline & Video Call
    noEventsRecorded: 'ఇంకా ఎలాంటి సంఘటనలు నమోదు కాలేదు',
    byActor: 'ద్వారా',
    calling: 'కాల్ చేస్తున్నారు',
    establishingUplink: 'సురక్షిత వైద్య అప్‌లింక్ స్థాపించబడుతోంది',
    you: 'మీరు',
    encrypted: 'పీర్-టు-పీర్ ఎన్‌క్రిప్టెడ్',
    consultationInProgress: 'వైద్య సంప్రదింపులు కొనసాగుతున్నాయి',`;

content = content.replace(/(en:\s*\{)/, '$1' + newEn);
content = content.replace(/(hi:\s*\{)/, '$1' + newHi);
content = content.replace(/(te:\s*\{)/, '$1' + newTe);

fs.writeFileSync(p, content);

let tl = fs.readFileSync('client/src/components/Timeline.jsx', 'utf8');
if (!tl.includes('useLanguage')) {
    tl = tl.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
    tl = tl.replace("const Timeline = ({ emergencyId }) => {", "const Timeline = ({ emergencyId }) => {\n  const { t } = useLanguage();");
}
tl = tl.replace(/>No events recorded yet</g, ">{t('noEventsRecorded')}<");
tl = tl.replace(/By \{event.actor.role\}/g, "{t('byActor')} {event.actor.role}");
fs.writeFileSync('client/src/components/Timeline.jsx', tl);

let vc = fs.readFileSync('client/src/components/VideoCall.jsx', 'utf8');
if (!vc.includes('useLanguage')) {
    vc = vc.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
    vc = vc.replace("const VideoCall = ({ emergencyId, userId, remoteId, userName, remoteName, role }) => {", "const VideoCall = ({ emergencyId, userId, remoteId, userName, remoteName, role }) => {\n  const { t } = useLanguage();");
}
vc = vc.replace(/>Calling \{remoteName\}\.\.\.</g, ">{t('calling')} {remoteName}...</");
vc = vc.replace(/>Establishing secure medical uplink</g, ">{t('establishingUplink')}<");
vc = vc.replace(/>You</g, ">{t('you')}<");
vc = vc.replace(/>PEER-TO-PEER ENCRYPTED</g, ">{t('encrypted')}<");
vc = vc.replace(/>Medical Consultation in Progress</g, ">{t('consultationInProgress')}<");
fs.writeFileSync('client/src/components/VideoCall.jsx', vc);

console.log('Timeline and VideoCall updated.');
