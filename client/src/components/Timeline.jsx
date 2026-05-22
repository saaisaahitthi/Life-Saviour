import { Box, VStack, HStack, Text, Icon, Flex, Badge, Spinner } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheckCircle, FiInfo, FiAlertCircle, FiTruck, FiActivity } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { emergencyService } from '../services/api';
import { getSocket } from '../services/socket';

const MotionBox = motion(Box);

const Timeline = ({ emergencyId }) => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!emergencyId) return;

    const fetchEvents = async () => {
      try {
        const { data } = await emergencyService.getTimeline(emergencyId);
        setEvents(data);
      } catch (err) {
        console.error('Error fetching timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    const socket = getSocket();
    socket.on('new_timeline_event', (event) => {
      if (event.emergencyId === emergencyId) {
        setEvents(prev => [event, ...prev]);
      }
    });

    return () => {
      socket.off('new_timeline_event');
    };
  }, [emergencyId]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'status_change': return FiCheckCircle;
      case 'assignment': return FiTruck;
      case 'medical': return FiActivity;
      case 'critical': return FiAlertCircle;
      default: return FiInfo;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'status_change': return 'green.400';
      case 'assignment': return 'blue.400';
      case 'medical': return 'teal.400';
      case 'critical': return 'red.400';
      default: return 'whiteAlpha.600';
    }
  };

  if (loading) return <Flex justify="center" py={4}><Spinner size="sm" color="brand.400" /></Flex>;

  return (
    <VStack align="stretch" spacing={0} position="relative">
      <Box position="absolute" left="15px" top="10px" bottom="10px" w="2px" bg="whiteAlpha.100" />
      
      <AnimatePresence initial={false}>
        {events.length === 0 ? (
          <Text fontSize="xs" color="whiteAlpha.400" textAlign="center" py={4}>{t('noEventsRecorded')}</Text>
        ) : (
          events.map((event, index) => (
            <MotionBox
              key={event._id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              pb={6}
              position="relative"
              pl={10}
            >
              <Flex
                position="absolute"
                left="0"
                top="0"
                w="32px"
                h="32px"
                borderRadius="full"
                bg="#0a0e1a"
                border="2px solid"
                borderColor={getEventColor(event.type)}
                align="center"
                justify="center"
                zIndex={1}
                boxShadow={`0 0 10px ${getEventColor(event.type)}33`}
              >
                <Icon as={getEventIcon(event.type)} boxSize={3} color={getEventColor(event.type)} />
              </Flex>
              
              <Box bg="rgba(255,255,255,0.03)" p={3} borderRadius="12px" border="1px solid rgba(255,255,255,0.06)">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="xs" fontWeight="700" color="white">{event.title}</Text>
                  <Text fontSize="10px" color="whiteAlpha.400">
                    {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="whiteAlpha.600" lineHeight="1.4">{event.description}</Text>
                {event.actor && (
                  <Badge mt={2} variant="subtle" colorScheme="gray" fontSize="9px" borderRadius="4px">
                    {t('byActor')} {event.actor.role}: {event.actor.name}
                  </Badge>
                )}
              </Box>
            </MotionBox>
          ))
        )}
      </AnimatePresence>
    </VStack>
  );
};

export default Timeline;
