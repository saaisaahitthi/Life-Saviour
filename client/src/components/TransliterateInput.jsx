import React from 'react';
import { ReactTransliterate } from 'react-transliterate';
import 'react-transliterate/dist/index.css';
import { useLanguage } from '../contexts/LanguageContext';
import { Input, Textarea } from '@chakra-ui/react';

const SUPPORTED_LANGUAGES = ['hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'];

const TransliterateInput = ({ value, onChangeText, as = 'input', ...props }) => {
  const { language } = useLanguage();

  const isSupported = SUPPORTED_LANGUAGES.includes(language);

  // If English or unsupported language, just render the native Chakra component
  if (!isSupported || language === 'en') {
    const Component = as === 'textarea' ? Textarea : Input;
    return (
      <Component 
        value={value} 
        onChange={(e) => onChangeText(e.target.value)} 
        {...props} 
      />
    );
  }

  // Otherwise wrap with Transliterate
  return (
    <ReactTransliterate
      value={value}
      onChangeText={onChangeText}
      lang={language}
      renderComponent={(transliterateProps) => {
        const Component = as === 'textarea' ? Textarea : Input;
        return <Component {...transliterateProps} {...props} />;
      }}
    />
  );
};

export default TransliterateInput;
