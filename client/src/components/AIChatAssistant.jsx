import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, VStack, HStack, Text, Input, Button, Avatar, 
  Flex, Spinner, Icon, Badge, IconButton, useToast
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiZap, FiUser, FiInfo, FiMapPin } from 'react-icons/fi';
import api from '../services/api';

const MotionBox = motion(Box);

const AIChatAssistant = ({ emergencyId, isDoctorView = false }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const scrollRef = useRef(null);
  const toast = useToast();
  const { language, t } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/ai-chat/history/${emergencyId}`);
        if (data && data.messages) {
          setMessages(data.messages);
        } else if (!isDoctorView) {
          // Send initial message if no history and patient view
          handleSend('');
        }
      } catch (err) {
        console.error('Error fetching AI history:', err);
      }
    };
    fetchHistory();
  }, [emergencyId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const messageText = text !== undefined ? text : input;
    if (messageText.trim() === '' && messages.length > 0) return;

    if (messageText) {
      setMessages(prev => [...prev, { role: 'user', content: messageText, timestamp: new Date() }]);
      setInput('');
    }

    setIsTyping(true);
    try {
      const { data } = await api.post('/ai-chat/message', {
        emergencyId,
        message: messageText,
        language
      });
      
      setMessages(prev => [...prev, { role: 'ai', content: data.message, timestamp: new Date() }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation is not supported by your browser', status: 'error' });
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const address = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
        handleSend(`My exact location is: ${address}`);
      } catch (err) {
        handleSend(`My exact location is: Lat ${position.coords.latitude}, Lng ${position.coords.longitude}`);
      } finally {
        setIsLocating(false);
      }
    }, () => {
      toast({ title: 'Unable to retrieve your location', status: 'error' });
      setIsLocating(false);
    });
  };

  return (
    <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" overflow="hidden" h="400px" display="flex" flexDirection="column" backdropFilter="blur(10px)">
      {/* Header */}
      <Flex p={4} bg="rgba(0,128,230,0.1)" borderBottom="1px solid rgba(255,255,255,0.06)" justify="space-between" align="center">
        <HStack>
          <Box p={2} bg="brand.500" borderRadius="10px">
            <Icon as={FiZap} color="white" />
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="800" color="white">{t('aiAssistantTitle')}</Text>
            <HStack spacing={1}>
              <Box w={1} h={1} borderRadius="full" bg="green.400" />
              <Text fontSize="10px" color="whiteAlpha.500">{t('aiAssistantStatus')}</Text>
            </HStack>
          </Box>
        </HStack>
        <Badge colorScheme="blue" variant="subtle" fontSize="9px">BETA</Badge>
      </Flex>

      {/* Messages */}
      <Box flex="1" overflowY="auto" p={4} ref={scrollRef} css={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.05)' } }}>
        <VStack align="stretch" spacing={4}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MotionBox 
                key={i} 
                initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW="85%"
              >
                <HStack align="flex-end" spacing={2} flexDir={msg.role === 'user' ? 'row-reverse' : 'row'}>
                  <Avatar size="xs" icon={msg.role === 'user' ? <FiUser /> : <FiZap />} bg={msg.role === 'user' ? 'whiteAlpha.200' : 'brand.500'} />
                  <Box 
                    p={3} 
                    bg={msg.role === 'user' ? 'brand.600' : 'rgba(255,255,255,0.05)'} 
                    borderRadius={msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px'}
                    border={msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)'}
                  >
                    <Text fontSize="xs" color="white" lineHeight="1.5">{msg.content}</Text>
                  </Box>
                </HStack>
              </MotionBox>
            ))}
          </AnimatePresence>
          {isTyping && (
            <HStack spacing={2} p={2}>
              <Avatar size="xs" icon={<FiZap />} bg="brand.500" />
              <HStack spacing={1}>
                <Box w={1} h={1} bg="whiteAlpha.400" borderRadius="full" className="typing-dot" />
                <Box w={1} h={1} bg="whiteAlpha.400" borderRadius="full" className="typing-dot" style={{ animationDelay: '0.2s' }} />
                <Box w={1} h={1} bg="whiteAlpha.400" borderRadius="full" className="typing-dot" style={{ animationDelay: '0.4s' }} />
              </HStack>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Input */}
      {!isDoctorView && (
        <Box p={4} borderTop="1px solid rgba(255,255,255,0.06)">
          <HStack spacing={2}>
            <Input 
              placeholder={t('answerAssistant')} 
              size="sm" 
              variant="filled" 
              bg="rgba(255,255,255,0.03)" 
              _hover={{ bg: 'rgba(255,255,255,0.05)' }} 
              _focus={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'brand.500' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <IconButton 
              icon={<FiMapPin />} 
              size="sm" 
              colorScheme="red" 
              variant="outline" 
              borderRadius="10px" 
              onClick={handleSendLocation}
              isLoading={isLocating}
              aria-label="Send Location"
            />
            <IconButton icon={<FiSend />} size="sm" colorScheme="blue" borderRadius="10px" onClick={() => handleSend()} />
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default AIChatAssistant;
