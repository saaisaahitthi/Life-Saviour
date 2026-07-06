import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, IconButton, HStack, VStack, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalBody, Flex,
  Avatar, Badge, Button, useToast
} from '@chakra-ui/react';
import { Peer } from 'peerjs';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff, FiPhoneIncoming } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../services/socket';
import { callService } from '../services/api';

const MotionBox = motion(Box);

const VideoCall = ({ emergencyId, userId, remoteId, userName, remoteName, role }) => {
  const { t } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, rejected

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callTimeoutRef = useRef(null);

  useEffect(() => {
    // We open peer connection when component mounts so we can receive calls even when modal is closed
    const newPeer = new Peer(userId + '-' + emergencyId);
    setPeer(newPeer);

    newPeer.on('open', (id) => {
      console.log('Peer ID:', id);
    });

    newPeer.on('call', (call) => {
      // Receive incoming call
      setIncomingCall(call);
      setCallStatus('ringing');
      onOpen(); // Open modal to show incoming call UI
    });

    return () => {
      newPeer.destroy();
      setPeer(null);
      clearTimeout(callTimeoutRef.current);
    };
  }, [userId, emergencyId]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleCallRejected = (data) => {
      if (data.emergencyId === emergencyId) {
        toast({ title: 'Call rejected', status: 'warning', duration: 3000 });
        endCallLocal();
      }
    };

    const handleCallTimeout = (data) => {
      if (data.emergencyId === emergencyId) {
        toast({ title: 'Missed Call', status: 'error', duration: 3000 });
        endCallLocal();
      }
    };

    socket.on('call_rejected', handleCallRejected);
    socket.on('call_timeout', handleCallTimeout);

    return () => {
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_timeout', handleCallTimeout);
    };
  }, [emergencyId, toast]);

  const initiateCall = () => {
    if (!peer) return;
    onOpen();
    setCallStatus('calling');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        
        const call = peer.call(remoteId + '-' + emergencyId, stream);
        
        call.on('stream', (rStream) => {
          clearTimeout(callTimeoutRef.current);
          setRemoteStream(rStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          setCallActive(true);
          setCallStatus('connected');
        });

        // 30 seconds timeout
        callTimeoutRef.current = setTimeout(() => {
          if (callStatus !== 'connected') {
            toast({ title: 'No answer', status: 'error', duration: 3000 });
            getSocket().emit('call_timeout', { emergencyId, to: remoteId });
            callService.logCall({ emergencyId, receiverId: remoteId, status: 'missed', duration: 0 });
            endCallLocal();
          }
        }, 30000);
      });
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        incomingCall.answer(stream);
        
        incomingCall.on('stream', (rStream) => {
          setRemoteStream(rStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          setCallActive(true);
          setCallStatus('connected');
        });
        setIncomingCall(null);
      });
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
    getSocket().emit('call_rejected', { emergencyId, to: remoteId });
    callService.logCall({ emergencyId, receiverId: userId, status: 'rejected', duration: 0 });
    endCallLocal();
  };

  const endCallLocal = () => {
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    setCallActive(false);
    setCallStatus('idle');
    setIncomingCall(null);
    setRemoteStream(null);
    clearTimeout(callTimeoutRef.current);
    onClose();
  };

  const endCall = () => {
    // If ending an active call, log it
    if (callActive) {
      callService.logCall({ emergencyId, receiverId: remoteId, status: 'completed', duration: 60 });
    }
    endCallLocal();
  };

  const toggleMute = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = !myStream.getAudioTracks()[0].enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStream) {
      myStream.getVideoTracks()[0].enabled = !myStream.getVideoTracks()[0].enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <>
      <IconButton
        icon={<FiVideo />}
        onClick={initiateCall}
        colorScheme="teal"
        variant="ghost"
        borderRadius="full"
        aria-label="Start Video Consultation"
      />

      <Modal isOpen={isOpen} onClose={endCallLocal} size="full" closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(20px)" />
        <ModalContent bg="#0a0e1a" p={0}>
          <ModalBody p={0} position="relative" h="100vh" overflow="hidden">
            
            {/* Incoming Call Screen */}
            {callStatus === 'ringing' && incomingCall && (
              <Flex w="100%" h="100%" align="center" justify="center" direction="column" bg="rgba(0,0,0,0.8)">
                <Avatar size="2xl" name={remoteName} mb={6} />
                <Text color="white" fontSize="2xl" fontWeight="bold" mb={2}>Incoming Video Call</Text>
                <Text color="whiteAlpha.700" mb={8}>from {remoteName}</Text>
                <HStack spacing={8}>
                  <Button 
                    colorScheme="green" size="lg" borderRadius="full" px={8}
                    leftIcon={<FiVideo />} onClick={acceptCall}>
                    Accept
                  </Button>
                  <Button 
                    colorScheme="red" size="lg" borderRadius="full" px={8}
                    leftIcon={<FiPhoneOff />} onClick={rejectCall}>
                    Reject
                  </Button>
                </HStack>
              </Flex>
            )}

            {/* Video Call Screen */}
            {callStatus !== 'ringing' && (
              <>
                {/* Remote Video (Full Screen) */}
                <Box w="100%" h="100%" bg="black">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Flex w="100%" h="100%" align="center" justify="center" direction="column">
                      <Avatar size="2xl" name={remoteName} mb={4} />
                      <Text color="white" fontSize="xl" fontWeight="bold">
                        {callStatus === 'calling' ? `Calling ${remoteName}...` : 'Connecting...'}
                      </Text>
                      {callStatus === 'calling' && <Text color="whiteAlpha.400" mt={2}>Waiting for answer...</Text>}
                    </Flex>
                  )}
                </Box>

                {/* My Video (Picture in Picture) */}
                {myStream && (
                  <MotionBox
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    position="absolute"
                    top="40px"
                    right="40px"
                    w="240px"
                    h="160px"
                    bg="rgba(15,20,40,0.8)"
                    borderRadius="24px"
                    overflow="hidden"
                    border="2px solid rgba(255,255,255,0.1)"
                    boxShadow="0 20px 50px rgba(0,0,0,0.5)"
                    zIndex={10}
                  >
                    {isVideoOff ? (
                      <Flex w="100%" h="100%" align="center" justify="center" bg="gray.800">
                        <FiVideoOff size={30} color="gray" />
                      </Flex>
                    ) : (
                      <video
                        ref={myVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    <Box position="absolute" bottom="10px" left="10px">
                      <Badge bg="rgba(0,0,0,0.5)" color="white" fontSize="10px">{t('you')}</Badge>
                    </Box>
                  </MotionBox>
                )}

                {/* Controls Overlay */}
                <VStack
                  position="absolute"
                  bottom="40px"
                  left="50%"
                  transform="translateX(-50%)"
                  spacing={6}
                  zIndex={20}
                >
                  <HStack spacing={6} bg="rgba(15,20,40,0.8)" p={4} px={8} borderRadius="full" border="1px solid rgba(255,255,255,0.1)" backdropFilter="blur(10px)">
                    <IconButton
                      icon={isMuted ? <FiMicOff /> : <FiMic />}
                      onClick={toggleMute}
                      colorScheme={isMuted ? 'red' : 'whiteAlpha'}
                      variant={isMuted ? 'solid' : 'ghost'}
                      size="lg"
                      borderRadius="full"
                      isDisabled={!callActive}
                    />
                    <IconButton
                      icon={isVideoOff ? <FiVideoOff /> : <FiVideo />}
                      onClick={toggleVideo}
                      colorScheme={isVideoOff ? 'red' : 'whiteAlpha'}
                      variant={isVideoOff ? 'solid' : 'ghost'}
                      size="lg"
                      borderRadius="full"
                      isDisabled={!callActive}
                    />
                    <IconButton
                      icon={<FiPhoneOff />}
                      onClick={endCall}
                      colorScheme="red"
                      size="lg"
                      borderRadius="full"
                      px={10}
                    />
                  </HStack>
                  <HStack bg="rgba(0,0,0,0.5)" px={4} py={1} borderRadius="full">
                    <Box w={2} h={2} borderRadius="full" bg="green.400" />
                    <Text color="white" fontSize="xs" fontWeight="700">{t('encrypted')}</Text>
                  </HStack>
                </VStack>

                {/* Header Overlay */}
                <Box position="absolute" top="40px" left="40px" zIndex={20}>
                  <HStack spacing={4}>
                    <VStack align="flex-start" spacing={0}>
                      <Text color="white" fontWeight="900" fontSize="2xl">{remoteName}</Text>
                      <Text color="whiteAlpha.600" fontSize="sm">{callActive ? t('consultationInProgress') : 'Calling'}</Text>
                    </VStack>
                  </HStack>
                </Box>
              </>
            )}

          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VideoCall;
