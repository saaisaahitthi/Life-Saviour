import { useState, useEffect, useRef } from 'react';
import { 
  Box, VStack, HStack, Text, Input, Button, Container, Flex, 
  Avatar, Badge, Spinner, IconButton, InputGroup, InputRightElement, 
  useToast, Grid, GridItem, Divider, Tooltip, Image
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiArrowLeft, FiCheck, FiCheckCircle, FiChevronLeft, FiUsers, FiShield, FiImage } from 'react-icons/fi';
import { MdEmergency } from 'react-icons/md';
import { chatService, emergencyService } from '../services/api';
import { getSocket, joinEmergencyRoom, leaveEmergencyRoom, sendSocketMessage, emitTyping, emitStopTyping } from '../services/socket';
import VideoCall from '../components/VideoCall';
import AIChatAssistant from '../components/AIChatAssistant';
import DocumentManager from '../components/DocumentManager';
import { useLanguage } from '../contexts/LanguageContext';
import DynamicText from '../components/DynamicText';
import TransliterateInput from '../components/TransliterateInput';

const MotionBox = motion(Box);

const EmergencyChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('role');
  const emergencyId = localStorage.getItem('activeEmergencyId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!emergencyId) { navigate(`/dashboard/${userRole}`); return; }
    const socket = getSocket();
    joinEmergencyRoom(emergencyId);

    const fetchData = async () => {
      try {
        const [msgRes, emRes] = await Promise.all([
          chatService.getMessages(emergencyId),
          emergencyService.getById(emergencyId)
        ]);
        setMessages(msgRes.data);
        setEmergency(emRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('typing', (data) => setTypingUser(data));
    socket.on('stop_typing', () => setTypingUser(null));
    socket.on('message_read', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status: 'read' } : m));
    });

    // Listen for emergency updates (e.g., driver assigned)
    socket.on('emergency_updated', (updated) => {
      if (updated._id === emergencyId) {
        setEmergency(updated);
      }
    });

    return () => {
      leaveEmergencyRoom(emergencyId);
      socket.off('receive_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('message_read');
      socket.off('emergency_updated');
    };
  }, [emergencyId]);

  useEffect(() => { scrollToBottom(); }, [messages, typingUser]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendSocketMessage({
      emergencyId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      message: newMessage.trim(),
      type: 'text'
    });
    emitStopTyping({ emergencyId });
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    emitTyping({ emergencyId, userName, userRole });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping({ emergencyId });
    }, 2000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('invalidFileType'), description: t('pleaseUploadImage'), status: 'error' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await chatService.uploadImage(formData);
      sendSocketMessage({
        emergencyId,
        senderId: userId,
        senderName: userName,
        senderRole: userRole,
        message: t('imageShared') || 'Image shared',
        type: 'image',
        imageUrl: data.imageUrl
      });
      toast({ title: t('imageSent'), status: 'success', duration: 2000 });
    } catch (err) {
      console.error(err);
      toast({ title: t('uploadFailed'), description: err.response?.data?.message || 'Error', status: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const getRoleColor = (role) => role === 'doctor' ? '#38a169' : role === 'driver' ? '#d69e2e' : '#0080e6';
  const getRoleLabel = (role) => role === 'doctor' ? '👨‍⚕️ Doctor' : role === 'driver' ? '🚑 Driver' : '🏥 Patient';

  // Determine participants in this channel
  const getParticipants = () => {
    if (!emergency) return [];
    const parts = [];
    parts.push({ name: emergency.patientName, role: 'patient', online: true });
    if (emergency.assignedDoctor) {
      parts.push({ 
        name: emergency.assignedDoctor?.name || 'Doctor', 
        role: 'doctor', 
        online: true 
      });
    }
    if (emergency.assignedDriver) {
      parts.push({ 
        name: emergency.assignedDriver?.name || 'Driver', 
        role: 'driver', 
        online: true 
      });
    }
    return parts;
  };

  // Video call only available if doctor has accepted the emergency
  const canVideoCall = emergency?.assignedDoctor && (userRole === 'doctor' || userRole === 'patient');
  const getRemoteVideoInfo = () => {
    if (userRole === 'doctor') {
      return { 
        remoteId: emergency.patientId?._id || emergency.patientId, 
        remoteName: emergency.patientName 
      };
    }
    // Patient calling doctor
    return { 
      remoteId: emergency.assignedDoctor?._id || emergency.assignedDoctor, 
      remoteName: emergency.assignedDoctor?.name || 'Doctor' 
    };
  };

  if (loading) return (
    <Flex minH="100vh" bg="#0a0e1a" align="center" justify="center" pt="80px">
      <VStack spacing={4}><Spinner color="brand.400" size="xl" /><Text color="whiteAlpha.400">{t('loadingChat')}</Text></VStack>
    </Flex>
  );

  const participants = getParticipants();

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="100px" pb="20px">
      <Container maxW="1600px" h="calc(100vh - 120px)">
        <Grid templateColumns={{ base: '1fr', lg: userRole === 'driver' ? '1fr' : '1fr 400px' }} gap={6} h="100%">
          {/* Main Chat Area */}
          <GridItem h="100%">
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} h="100%">
              <Flex direction="column" bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" overflow="hidden" h="100%" backdropFilter="blur(20px)">
                {/* Header */}
                <Flex p={4} borderBottom="1px solid rgba(255,255,255,0.06)" bg="rgba(255,255,255,0.02)" justify="space-between" align="center">
                  <HStack spacing={4}>
                    <IconButton icon={<FiChevronLeft />} variant="ghost" onClick={() => navigate(-1)} size="sm" />
                    <Box p={2} bg="rgba(229,62,62,0.15)" borderRadius="12px">
                      <MdEmergency size={20} color="#e53e3e" />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="800">{t('emergencyChannelTitle')}</Text>
                      <Text fontSize="10px" color="whiteAlpha.400">{emergency?.patientName} • {emergency?.severity?.toUpperCase()}</Text>
                    </Box>
                  </HStack>
                  <HStack spacing={3}>
                    {/* Participants badges */}
                    <HStack spacing={1}>
                      {participants.map((p, i) => (
                        <Tooltip key={i} label={`${getRoleLabel(p.role)}: ${p.name}`} placement="bottom">
                          <Avatar size="xs" name={p.name} bg={getRoleColor(p.role)} />
                        </Tooltip>
                      ))}
                    </HStack>

                    {/* Video call - only when doctor has accepted */}
                    {canVideoCall && (() => {
                      const { remoteId, remoteName } = getRemoteVideoInfo();
                      return (
                        <VideoCall 
                          emergencyId={emergencyId}
                          userId={userId}
                          remoteId={remoteId}
                          userName={userName}
                          remoteName={remoteName}
                          role={userRole}
                        />
                      );
                    })()}

                    {!canVideoCall && emergency && !emergency.assignedDoctor && (
                      <Tooltip label="Video call available after doctor accepts">
                        <Badge colorScheme="yellow" fontSize="9px" px={2} py={1} borderRadius="6px">
                          <HStack spacing={1}><FiShield size={10} /><Text>{t('awaitingDoctorBadge')}</Text></HStack>
                        </Badge>
                      </Tooltip>
                    )}

                    <Box w={2} h={2} borderRadius="full" bg="#38a169" boxShadow="0 0 8px #38a169" />
                    <Text fontSize="xs" color="whiteAlpha.400" display={{ base: 'none', md: 'block' }}>LIVE</Text>
                  </HStack>
                </Flex>

                {/* Participants Banner */}
                <Flex px={4} py={2} bg="rgba(0,128,230,0.05)" borderBottom="1px solid rgba(255,255,255,0.04)" align="center" gap={2}>
                  <FiUsers size={12} color="rgba(255,255,255,0.3)" />
                  <Text fontSize="10px" color="whiteAlpha.400">
                    {participants.map(p => `${p.name} (${p.role})`).join(' • ')}
                    {!emergency?.assignedDoctor && ` • ${t('waitingForDoctor')}`}
                    {emergency?.assignedDoctor && !emergency?.assignedDriver && ` • ${t('waitingForDriver')}`}
                  </Text>
                </Flex>

                {/* System Messages for Joins */}
                {emergency?.assignedDoctor && messages.length === 0 && (
                  <Flex justify="center" py={3}>
                    <Badge bg="rgba(56,161,105,0.1)" color="green.300" fontSize="10px" px={3} py={1} borderRadius="full">
                      Dr. {emergency.assignedDoctor?.name || 'Doctor'} has joined the emergency channel
                    </Badge>
                  </Flex>
                )}

                {/* Messages Area */}
                <Box flex="1" overflowY="auto" p={6} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.05)', borderRadius: '10px' } }}>
                  <VStack spacing={4} align="stretch">
                    {messages.map((msg, i) => {
                      const isOwn = msg.senderId === userId || msg.senderId?._id === userId;
                      
                      // System messages (like driver joined, etc.)
                      if (msg.type === 'system') {
                        return (
                          <Flex key={msg._id || i} justify="center" py={1}>
                            <Badge bg="rgba(255,255,255,0.05)" color="whiteAlpha.500" fontSize="10px" px={3} py={1} borderRadius="full">
                              <DynamicText as="span" text={msg.message} />
                            </Badge>
                          </Flex>
                        );
                      }

                      return (
                        <Flex key={msg._id || i} justify={isOwn ? 'flex-end' : 'flex-start'}>
                          <VStack align={isOwn ? 'flex-end' : 'flex-start'} spacing={1} maxW="70%">
                            {!isOwn && (
                              <HStack spacing={2} px={1}>
                                <Avatar size="2xs" name={msg.senderName} bg={getRoleColor(msg.senderRole)} />
                                <Text fontSize="xs" color="whiteAlpha.400" fontWeight="600">{msg.senderName}</Text>
                                <Badge fontSize="8px" colorScheme={msg.senderRole === 'doctor' ? 'green' : msg.senderRole === 'driver' ? 'yellow' : 'blue'} variant="subtle">
                                  {msg.senderRole}
                                </Badge>
                              </HStack>
                            )}
                            <Box 
                              p={3} 
                              borderRadius={isOwn ? '18px 18px 2px 18px' : '18px 18px 18px 2px'} 
                              bg={isOwn ? 'brand.500' : msg.senderRole === 'doctor' ? 'rgba(56,161,105,0.12)' : msg.senderRole === 'driver' ? 'rgba(214,158,46,0.12)' : 'rgba(255,255,255,0.05)'} 
                              border={isOwn ? 'none' : `1px solid ${msg.senderRole === 'doctor' ? 'rgba(56,161,105,0.2)' : msg.senderRole === 'driver' ? 'rgba(214,158,46,0.2)' : 'rgba(255,255,255,0.08)'}`}
                              maxW="100%"
                            >
                              {msg.type === 'image' ? (
                                <VStack align="stretch" spacing={2}>
                                  <Image 
                                    src={msg.imageUrl} 
                                    alt="Medical Image" 
                                    borderRadius="12px" 
                                    maxH="300px" 
                                    objectFit="cover" 
                                    fallback={<Box h="200px" w="200px" bg="whiteAlpha.100" display="flex" alignItems="center" justifyContent="center"><Spinner /></Box>}
                                    onClick={() => window.open(msg.imageUrl, '_blank')}
                                    cursor="pointer"
                                  />
                                  <DynamicText as="p" fontSize="sm" text={msg.message} />
                                </VStack>
                              ) : (
                                <DynamicText as="p" fontSize="sm" text={msg.message} />
                              )}
                            </Box>
                            <HStack spacing={1} px={1}>
                              <Text fontSize="9px" color="whiteAlpha.300">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                              {isOwn && (msg.status === 'read' ? <FiCheckCircle size={10} color="#38a169" /> : <FiCheck size={10} color="whiteAlpha.300" />)}
                            </HStack>
                          </VStack>
                        </Flex>
                      );
                    })}
                    {typingUser && typingUser.id !== userId && (
                      <HStack spacing={2} px={4}>
                        <Avatar size="2xs" name={typingUser.userName} bg={getRoleColor(typingUser.userRole)} />
                        <Text fontSize="xs" color="whiteAlpha.400" fontStyle="italic">{typingUser.userName} is typing...</Text>
                      </HStack>
                    )}
                    <div ref={messagesEndRef} />
                  </VStack>
                </Box>

                {/* Input Area */}
                <Box p={4} borderTop="1px solid rgba(255,255,255,0.06)" bg="rgba(0,0,0,0.2)">
                  <HStack spacing={4}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    <IconButton 
                      icon={uploading ? <Spinner size="xs" /> : <FiImage />} 
                      variant="ghost" 
                      color="whiteAlpha.400" 
                      onClick={() => fileInputRef.current.click()}
                      isDisabled={uploading}
                    />
                    <InputGroup size="lg">
                      <TransliterateInput 
                        placeholder={t('typeYourMessage')} 
                        variant="filled" 
                        bg="rgba(255,255,255,0.03)" 
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }} 
                        _focus={{ bg: 'rgba(255,255,255,0.08)', borderColor: 'brand.500' }} 
                        value={newMessage} 
                        onChangeText={(text) => {
                          setNewMessage(text);
                          const s = getSocket();
                          if (s && s.connected) {
                            s.emit('typing', { emergencyId, userId, userName, userRole });
                          }
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                      />
                      <InputRightElement width="4.5rem">
                        <IconButton 
                          h="1.75rem" 
                          size="sm" 
                          icon={<FiSend />} 
                          colorScheme="blue" 
                          onClick={handleSend} 
                          isDisabled={!newMessage.trim()} 
                        />
                      </InputRightElement>
                    </InputGroup>
                  </HStack>
                </Box>
              </Flex>
            </MotionBox>
          </GridItem>

          {/* AI Assistant & Documents Sidebar */}
          {userRole !== 'driver' && (
            <GridItem h="100%" display={{ base: 'none', lg: 'block' }}>
              <VStack spacing={6} h="100%" align="stretch">
              <AIChatAssistant emergencyId={emergencyId} isDoctorView={userRole === 'doctor'} />
              <Box flex="1" overflowY="auto" className="custom-scroll">
                <DocumentManager 
                  emergencyId={emergencyId} 
                  initialAttachments={emergency?.attachments || []} 
                  role={userRole} 
                />
              </Box>
              </VStack>
            </GridItem>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default EmergencyChat;
