import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, IconButton, HStack, VStack, Text, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalBody, Flex,
  Avatar, Badge, Button, Icon
} from '@chakra-ui/react';
import { Peer } from 'peerjs';
import { FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhoneOff, FiMaximize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const VideoCall = ({ emergencyId, userId, remoteId, userName, remoteName, role }) => {
  const { t } = useLanguage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [peer, setPeer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (isOpen && !peer) {
      const newPeer = new Peer(userId + '-' + emergencyId);
      setPeer(newPeer);

      newPeer.on('open', (id) => {
        console.log('Peer ID:', id);
        if (role === 'doctor') {
          // Doctor initiates call to the remote ID (usually patient or driver)
          startCall(newPeer, remoteId + '-' + emergencyId);
        }
      });

      newPeer.on('call', (call) => {
        // Answer incoming call
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setMyStream(stream);
            if (myVideoRef.current) myVideoRef.current.srcObject = stream;
            call.answer(stream);
            call.on('stream', (rStream) => {
              setRemoteStream(rStream);
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
              setCallActive(true);
            });
          });
      });

      return () => {
        newPeer.destroy();
        setPeer(null);
      };
    }
  }, [isOpen]);

  const startCall = (p, rId) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        const call = p.call(rId, stream);
        call.on('stream', (rStream) => {
          setRemoteStream(rStream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = rStream;
          setCallActive(true);
        });
      });
  };

  const endCall = () => {
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    setCallActive(false);
    onClose();
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
        onClick={onOpen}
        colorScheme="teal"
        variant="ghost"
        borderRadius="full"
        aria-label="Start Video Consultation"
      />

      <Modal isOpen={isOpen} onClose={endCall} size="full">
        <ModalOverlay backdropFilter="blur(20px)" />
        <ModalContent bg="#0a0e1a" p={0}>
          <ModalBody p={0} position="relative" h="100vh" overflow="hidden">
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
                  <Avatar size="2xl" name={remoteName} mb={4} src="" />
                  <Text color="white" fontSize="xl" fontWeight="bold">{t('calling')} {remoteName}...</Text>
                  <Text color="whiteAlpha.400" mt={2}>{t('establishingUplink')}</Text>
                </Flex>
              )}
            </Box>

            {/* My Video (Picture in Picture) */}
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
                />
                <IconButton
                  icon={isVideoOff ? <FiVideoOff /> : <FiVideo />}
                  onClick={toggleVideo}
                  colorScheme={isVideoOff ? 'red' : 'whiteAlpha'}
                  variant={isVideoOff ? 'solid' : 'ghost'}
                  size="lg"
                  borderRadius="full"
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
                  <Text color="whiteAlpha.600" fontSize="sm">{t('consultationInProgress')}</Text>
                </VStack>
              </HStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VideoCall;
