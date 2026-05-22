const fs = require('fs');
const p = 'client/src/i18n/translations.js';
let content = fs.readFileSync(p, 'utf8');

const newEn = `
    // Notifications
    notificationsTitle: 'Notifications',
    noNotifications: 'No notifications yet',`;

const newHi = `
    // Notifications
    notificationsTitle: 'सूचनाएं',
    noNotifications: 'अभी तक कोई सूचना नहीं',`;

const newTe = `
    // Notifications
    notificationsTitle: 'నోటిఫికేషన్‌లు',
    noNotifications: 'ఇంకా నోటిఫికేషన్‌లు లేవు',`;

content = content.replace(/(en:\s*\{)/, '$1' + newEn);
content = content.replace(/(hi:\s*\{)/, '$1' + newHi);
content = content.replace(/(te:\s*\{)/, '$1' + newTe);

fs.writeFileSync(p, content);

let notif = fs.readFileSync('client/src/components/NotificationBell.jsx', 'utf8');
if (!notif.includes('useLanguage')) {
    notif = notif.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useLanguage } from '../contexts/LanguageContext';");
    notif = notif.replace("const NotificationBell = () => {", "const NotificationBell = () => {\n  const { t } = useLanguage();");
}
notif = notif.replace(/>Notifications</g, ">{t('notificationsTitle')}<");
notif = notif.replace(/>No notifications yet</g, ">{t('noNotifications')}<");
fs.writeFileSync('client/src/components/NotificationBell.jsx', notif);

console.log('NotificationBell updated.');
