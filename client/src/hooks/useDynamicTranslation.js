import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const translationCache = new Map();

export const useDynamicTranslation = (text) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }

    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${language}_${text}`;
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey));
      return;
    }

    const translate = async () => {
      setIsTranslating(true);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        let result = '';
        if (data && data[0]) {
          data[0].forEach(part => {
            if (part[0]) result += part[0];
          });
        }
        
        if (result) {
          translationCache.set(cacheKey, result);
          setTranslatedText(result);
        } else {
          setTranslatedText(text); // fallback
        }
      } catch (err) {
        console.error('Translation error:', err);
        setTranslatedText(text); // fallback to original on error
      } finally {
        setIsTranslating(false);
      }
    };

    const timeoutId = setTimeout(() => translate(), 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [text, language]);

  return { translatedText, isTranslating };
};
