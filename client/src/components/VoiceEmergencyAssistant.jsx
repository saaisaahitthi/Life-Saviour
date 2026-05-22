import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, IconButton, Text, VStack, HStack, Flex, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader,
  ModalCloseButton, Button, Badge, Icon
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiSquare, FiActivity, FiZap } from 'react-icons/fi';
import { MdEmergency } from 'react-icons/md';

const MotionBox = motion(Box);

const VoiceEmergencyAssistant = ({ onTranscriptionComplete }) => {
  const { t } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = transcript;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setTranscript(final);
      setInterimTranscript(interim);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      onOpen();
    }
  };

  const handleFinish = () => {
    recognitionRef.current.stop();
    onTranscriptionComplete(transcript.trim());
    onClose();
  };

  return (
    <>
      <IconButton
        icon={isListening ? <FiSquare /> : <FiMic />}
        onClick={toggleListening}
        colorScheme={isListening ? 'red' : 'blue'}
        borderRadius="full"
        size="lg"
        boxShadow={isListening ? '0 0 15px rgba(229, 62, 62, 0.5)' : 'none'}
        aria-label="Voice Reporting"
      />

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#0a0e1a" border="1px solid rgba(0, 128, 230, 0.3)" borderRadius="24px">
          <ModalHeader color="white" borderBottom="1px solid rgba(255,255,255,0.06)">
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiZap} color="blue.400" />
                <Text>{t('voiceAssistant')}</Text>
              </HStack>
              <Badge colorScheme="blue" variant="subtle">{t('listening')}</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={10}>
            <VStack spacing={8}>
              {/* Waveform Animation */}
              <Flex align="center" h="60px" gap={1}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <MotionBox
                    key={i}
                    w="4px"
                    bg="blue.400"
                    borderRadius="full"
                    animate={{
                      height: isListening ? [20, 50, 15, 40, 20] : 10
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </Flex>

              <Box
                w="100%"
                p={6}
                bg="rgba(255,255,255,0.03)"
                borderRadius="20px"
                minH="150px"
                border="1px dashed rgba(255,255,255,0.1)"
              >
                <Text color="white" fontSize="lg" lineHeight="1.6">
                  {transcript}
                  <Text as="span" color="whiteAlpha.400">{interimTranscript}</Text>
                  {!transcript && !interimTranscript && (
                    <Text color="whiteAlpha.300" fontStyle="italic">{t('voicePlaceholder')}</Text>
                  )}
                </Text>
              </Box>

              <HStack w="100%" spacing={4}>
                <Button w="100%" h="55px" borderRadius="16px" bg="blue.600" color="white" _hover={{ bg: 'blue.500' }} onClick={handleFinish}>{t('analyzeAutoFill')}</Button>
                <Button w="100%" h="55px" borderRadius="16px" variant="ghost" color="whiteAlpha.400" onClick={onClose}>{t('cancel')}</Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoiceEmergencyAssistant;
