import { useState } from 'react';
import { Box, HStack, Text, Button, Menu, MenuButton, MenuList, MenuItem, Icon } from '@chakra-ui/react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' }
];

const LanguageSelector = ({ onLanguageChange }) => {
  const { language: currentLang, changeLanguage } = useLanguage();
  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const handleChange = async (langCode) => {
    changeLanguage(langCode);
    if (onLanguageChange) onLanguageChange(langCode);

    // Persist to backend
    try {
      await api.put('/family/language', { language: langCode });
    } catch (err) { /* not logged in or server down */ }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="xs"
        variant="ghost"
        color="whiteAlpha.600"
        rightIcon={<FiChevronDown />}
        leftIcon={<FiGlobe />}
        _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
        borderRadius="8px"
      >
        <Text fontSize="10px">{current.flag} {current.label}</Text>
      </MenuButton>
      <MenuList bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="12px" minW="140px">
        {LANGUAGES.map(lang => (
          <MenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            bg={currentLang === lang.code ? 'rgba(0,128,230,0.15)' : 'transparent'}
            _hover={{ bg: 'rgba(255,255,255,0.08)' }}
            fontSize="sm"
          >
            <HStack spacing={2}>
              <Text>{lang.flag}</Text>
              <Text>{lang.label}</Text>
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default LanguageSelector;
