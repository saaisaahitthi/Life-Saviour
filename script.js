const fs = require('fs');
let doc = fs.readFileSync('client/src/components/DocumentManager.jsx', 'utf8');

if (!doc.includes('useLanguage')) {
    doc = doc.replace("import { useState, useRef, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
    doc = doc.replace("const DocumentManager = ({ emergencyId, initialAttachments = [], role }) => {", "const DocumentManager = ({ emergencyId, initialAttachments = [], role }) => {\n  const { t } = useLanguage();");
}

doc = doc.replace(/>Medical Documents</g, ">{t('medicalDocuments')}<");
doc = doc.replace(/>Prescription</g, ">{t('prescriptionDoc')}<");
doc = doc.replace(/>Scan</g, ">{t('scanDoc')}<");
doc = doc.replace(/>Blood Report</g, ">{t('bloodReportDoc')}<");
doc = doc.replace(/>X-Ray</g, ">{t('xrayDoc')}<");
doc = doc.replace(/>Injury Image</g, ">{t('injuryImageDoc')}<");
doc = doc.replace(/>Discharge</g, ">{t('dischargeDoc')}<");
doc = doc.replace(/>Other</g, ">{t('otherDoc')}<");
doc = doc.replace(/>\s*Upload\s*</g, ">{t('upload')}<");
doc = doc.replace(/>Uploading Document\.\.\.</g, ">{t('uploadingDocument')}<");
doc = doc.replace(/>No medical files attached yet</g, ">{t('noMedicalFiles')}<");
doc = doc.replace(/>Document Preview</g, ">{t('documentPreview')}<");

fs.writeFileSync('client/src/components/DocumentManager.jsx', doc);
console.log('DocumentManager updated.');
