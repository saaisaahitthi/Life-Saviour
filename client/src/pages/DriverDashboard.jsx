import { useState, useEffect, useRef } from 'react';
import { Box, VStack, HStack, Text, Button, Heading, SimpleGrid, Badge, Container, useToast, Flex, Spinner, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiNavigation, FiMessageCircle, FiMapPin, FiClock, FiCheckCircle, FiTruck } from 'react-icons/fi';
import { MdLocalHospital, MdEmergency } from 'react-icons/md';
import { emergencyService } from '../services/api';
import { sendLocationUpdate, joinEmergencyRoom, sendDriverLocation, getSocket } from '../services/socket';
import { useLanguage } from '../contexts/LanguageContext';
import DynamicText from '../components/DynamicText';

const MotionBox = motion(Box);

const DriverDashboard = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [myMissions, setMyMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCoords, setCurrentCoords] = useState({ lat: 17.731277, lng: 83.315077 }); // Fallback to Visakhapatnam center for testing
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const userName = localStorage.getItem('userName') || 'Driver';
  const watchIdRef = useRef(null);

  useEffect(() => { 
    fetchData(); 
    
    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => fetchData();
      socket.on('new_emergency', handleUpdate);
      socket.on('emergency_updated', handleUpdate);
      return () => {
        socket.off('new_emergency', handleUpdate);
        socket.off('emergency_updated', handleUpdate);
      };
    }
  }, []);

  const fetchData = async () => {
    try {
      const [active, my] = await Promise.all([emergencyService.getActive(), emergencyService.getMy()]);
      setEmergencies(active.data);
      setMyMissions(my.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAcceptMission = async (id) => {
    try {
      await emergencyService.assignDriver(id);
      toast({ title: t('missionAccepted'), description: t('navigatePickup'), status: 'success', duration: 3000, position: 'top-right' });
      fetchData();
    } catch (err) { toast({ title: 'Error', description: err.response?.data?.message || 'Failed', status: 'error', duration: 3000, position: 'top-right' }); }
  };

  const handleStartNavigation = async (id) => {
    try {
      await emergencyService.update(id, { status: 'in_progress' });
      toast({ title: t('navigationStartedToast'), description: t('navigationStartedDesc'), status: 'success', duration: 3000, position: 'top-right' });
      fetchData();
    } catch (err) { toast({ title: 'Error', description: err.response?.data?.message || 'Failed', status: 'error', duration: 3000, position: 'top-right' }); }
  };

  const handleResolveMission = async (id) => {
    try {
      await emergencyService.update(id, { status: 'dropped_off' });
      toast({ title: t('arrivedAtHospital') || 'Arrived at Hospital', description: t('patientDroppedOff') || 'Patient successfully dropped off. You are now available.', status: 'success', duration: 5000, position: 'top-right' });
      fetchData();
    } catch (err) { toast({ title: 'Error', description: err.response?.data?.message || 'Failed to complete mission', status: 'error', duration: 3000, position: 'top-right' }); }
  };

  const getSevColor = (s) => s === 'critical' ? '#e53e3e' : s === 'medium' ? '#d69e2e' : '#38a169';
  const activeMission = myMissions.find(e => ['assigned', 'in_progress'].includes(e.status));

  // Global Location Tracking for Dispatch
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    let globalWatchId = null;

    if (navigator.geolocation && userId) {
      globalWatchId = navigator.geolocation.watchPosition(
        (position) => {
          sendDriverLocation({
            userId,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error("Global geolocation error:", error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    return () => {
      if (globalWatchId) navigator.geolocation.clearWatch(globalWatchId);
    };
  }, []);

  useEffect(() => {
    let intervalId;
    if (activeMission && ['assigned', 'in_progress'].includes(activeMission.status)) {
      joinEmergencyRoom(activeMission._id);
      
      // Instantly send the last known global coordinates and repeat every 5 seconds
      // so if Patient/Doctor refresh their page, they don't miss the location!
      const broadcastLocation = () => {
        if (currentCoords) {
          sendLocationUpdate({
            emergencyId: activeMission._id,
            lat: currentCoords.lat,
            lng: currentCoords.lng
          });
        }
      };
      
      broadcastLocation();
      intervalId = setInterval(broadcastLocation, 5000);
      
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentCoords({ lat: latitude, lng: longitude });
            sendLocationUpdate({
              emergencyId: activeMission._id,
              lat: latitude,
              lng: longitude
            });
          },
          (error) => console.error("Emergency geolocation error:", error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [activeMission]);

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px">
      <Box position="fixed" bottom="-20%" right="-15%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(0,188,212,0.05) 0%, transparent 70%)" filter="blur(60px)" pointerEvents="none" />
      <Container maxW="1200px" py={8} px={{ base: 4, md: 8 }}>
        {/* Header */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} mb={8}>
          <Flex justify="space-between" flexWrap="wrap" gap={4} align="center">
            <Box>
              <Text fontSize="sm" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="1px">{t('ambulanceDispatch')}</Text>
              <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800">{userName}</Heading>
            </Box>
            <HStack spacing={3} bg="rgba(0,188,212,0.1)" border="1px solid rgba(0,188,212,0.3)" px={4} py={2} borderRadius="12px">
              <Box w={2} h={2} borderRadius="full" bg="#00bcd4" boxShadow="0 0 8px #00bcd4" />
              <Text fontSize="xs" color="teal.300" fontWeight="700">{t('onDuty')}</Text>
            </HStack>
          </Flex>
        </MotionBox>

        {/* Stats */}
        <SimpleGrid columns={{ base: 3 }} spacing={4} mb={8}>
          {[
            { label: t('activeMission'), value: activeMission ? 1 : 0, color: '#e53e3e', icon: MdEmergency },
            { label: t('availableJobs'), value: emergencies.filter(e => !e.assignedDriver && (e.assignedDoctor || e.transportType === 'cab')).length, color: '#0080e6', icon: FiTruck },
            { label: t('completedTrips'), value: myMissions.filter(e => e.status === 'resolved' || e.status === 'dropped_off').length, color: '#38a169', icon: FiCheckCircle },
          ].map((stat, i) => (
            <MotionBox key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={5}>
                <HStack mb={2}><Box w="36px" h="36px" borderRadius="10px" bg={`${stat.color}15`} display="flex" alignItems="center" justifyContent="center"><stat.icon color={stat.color} size={18} /></Box></HStack>
                <Text fontSize="2xl" fontWeight="800">{stat.value}</Text>
                <Text fontSize="xs" color="whiteAlpha.400" fontWeight="600">{stat.label}</Text>
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Active Mission */}
        {activeMission && (
          <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} mb={8}>
            <Box bg="linear-gradient(135deg, rgba(229,62,62,0.1) 0%, rgba(0,128,230,0.08) 100%)" border="1px solid rgba(229,62,62,0.2)" borderRadius="24px" p={{ base: 6, md: 8 }} position="relative" overflow="hidden">
              <Box position="absolute" top="0" left="0" right="0" h="2px" bgGradient="linear(to-r, emergency.500, brand.500)" />
              <HStack mb={4}>
                <Box w={3} h={3} borderRadius="full" bg="#e53e3e" boxShadow="0 0 12px #e53e3e" />
                <Text fontSize="xs" color="emergency.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('activeMission')}</Text>
                <Badge colorScheme="red" fontSize="10px">{activeMission.severity.toUpperCase()}</Badge>
                {activeMission.aiTriage && <Badge colorScheme="cyan" fontSize="10px">{activeMission.aiTriage.category?.toUpperCase()}</Badge>}
                {activeMission.transportType === 'cab' && <Badge colorScheme="blue" fontSize="10px" display="flex" alignItems="center" gap={1}><FiTruck /> {t('transportOnly')}</Badge>}
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
                <Box bg="rgba(0,0,0,0.2)" borderRadius="16px" p={5}>
                  <HStack mb={2}><FiMapPin color="#0080e6" /><Text fontSize="xs" color="brand.300" fontWeight="700">{t('pickupLocation')}</Text></HStack>
                  <Text fontWeight="600">{activeMission.location}</Text>
                </Box>
                <Box bg="rgba(0,0,0,0.2)" borderRadius="16px" p={5}>
                  <HStack mb={2}><MdEmergency color="#e53e3e" /><Text fontSize="xs" color="emergency.300" fontWeight="700">{t('patientCondition')}</Text></HStack>
                  <Text fontWeight="600">{activeMission.patientName}</Text>
                  <DynamicText as="p" fontSize="sm" color="whiteAlpha.400" text={activeMission.symptoms?.substring(0, 60)} />
                </Box>
                <Box bg="rgba(0,0,0,0.2)" borderRadius="16px" p={5}>
                  <HStack mb={2}><MdLocalHospital color="#00bcd4" /><Text fontSize="xs" color="teal.300" fontWeight="700">{t('assignedHospital')}</Text></HStack>
                  <Text fontWeight="600">{activeMission.assignedHospital?.name || t('previewCityGeneral')}</Text>
                  <Text fontSize="sm" color="whiteAlpha.400">{activeMission.assignedHospital?.location?.address || t('emergencyWardFallback')}</Text>
                </Box>
              </SimpleGrid>
              <HStack spacing={3} flexWrap="wrap">
                {activeMission.status === 'assigned' && <Button size="md" bg="linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)" color="white" borderRadius="12px" leftIcon={<FiNavigation />} onClick={() => handleStartNavigation(activeMission._id)} _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,128,230,0.4)' }}>{t('startNavigation')}</Button>}
                {activeMission.status === 'in_progress' && (
                  <>
                    <Button 
                      size="md" 
                      bg="rgba(0,188,212,0.2)" 
                      color="teal.300" 
                      borderRadius="12px" 
                      leftIcon={
                        <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                          <FiMapPin />
                          <Box position="absolute" top="-2px" right="-2px" w="6px" h="6px" bg="red.500" borderRadius="full" className="pulse-dot" />
                        </Box>
                      }
                      onClick={() => {
                        const originParam = currentCoords ? `&origin=${currentCoords.lat},${currentCoords.lng}` : '';
                        let url = `https://www.google.com/maps/dir/?api=1${originParam}`;
                        
                        if (activeMission.assignedHospital?.location?.coordinates) {
                          url += `&waypoints=${activeMission.coordinates.lat},${activeMission.coordinates.lng}`;
                          url += `&destination=${activeMission.assignedHospital.location.coordinates.lat},${activeMission.assignedHospital.location.coordinates.lng}`;
                        } else if (activeMission.coordinates?.lat) {
                          // Fallback destination (City General) roughly 2km away from patient for testing
                          const fallbackLat = activeMission.coordinates.lat + 0.02;
                          const fallbackLng = activeMission.coordinates.lng + 0.02;
                          url += `&waypoints=${activeMission.coordinates.lat},${activeMission.coordinates.lng}`;
                          url += `&destination=${fallbackLat},${fallbackLng}`;
                        } else {
                          url += `&destination=${encodeURIComponent(activeMission.location)}`;
                        }
                        
                        window.open(url, '_blank');
                      }}
                      _hover={{ bg: 'rgba(0,188,212,0.3)', transform: 'translateY(-2px)' }}
                    >
                      {t('trackingLiveLocation')}
                    </Button>
                    <Button size="md" bg="linear-gradient(135deg, #38a169 0%, #2f855a 100%)" color="white" borderRadius="12px" leftIcon={<FiCheckCircle />} onClick={() => handleResolveMission(activeMission._id)} _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(56,161,105,0.4)' }}>{t('markArrived') || 'Mark Arrived & Complete'}</Button>
                  </>
                )}
                <Button size="md" bg="rgba(229,62,62,0.15)" color="emergency.300" borderRadius="12px" leftIcon={<FiMessageCircle />} onClick={() => { localStorage.setItem('activeEmergencyId', activeMission._id); navigate('/chat'); }} _hover={{ bg: 'rgba(229,62,62,0.25)' }}>{t('emergencyChat')}</Button>
              </HStack>
            </Box>
          </MotionBox>
        )}

        {/* Available Missions */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} mb={8}>
          <HStack mb={4}><FiTruck color="rgba(255,255,255,0.4)" /><Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('availableMissions')}</Text></HStack>
          {loading ? <Flex justify="center" py={10}><Spinner color="brand.400" /></Flex> : (
            <VStack spacing={4} align="stretch">
              {emergencies.filter(e => !e.assignedDriver && (e.assignedDoctor || e.transportType === 'cab')).map((em) => (
                <Box key={em._id} bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="20px" p={6} _hover={{ border: '1px solid rgba(0,188,212,0.2)' }} transition="all 0.3s">
                  <Flex justify="space-between" flexWrap="wrap" gap={3} mb={3}>
                    <HStack spacing={3}>
                      <Box w="40px" h="40px" borderRadius="12px" bg={`${getSevColor(em.severity)}15`} display="flex" alignItems="center" justifyContent="center">
                        <MdEmergency color={getSevColor(em.severity)} size={18} />
                      </Box>
                      <Box>
                        <HStack>
                          <Text fontWeight="700">{em.patientName}</Text>
                          <Badge colorScheme={em.severity === 'critical' ? 'red' : 'orange'} fontSize="10px">{em.severity}</Badge>
                          {em.transportType === 'cab' && <Badge colorScheme="blue" fontSize="10px">{t('transportOnly')}</Badge>}
                        </HStack>
                        <Text fontSize="xs" color="whiteAlpha.400"><FiMapPin style={{ display: 'inline', marginRight: 4 }} />{em.location}</Text>
                      </Box>
                    </HStack>
                  </Flex>
                  <HStack spacing={3}>
                    <Button 
                      size="sm" 
                      bg="linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)" 
                      color="white" 
                      borderRadius="10px" 
                      onClick={() => handleAcceptMission(em._id)} 
                      isDisabled={!!activeMission}
                      _hover={{ transform: 'translateY(-1px)' }}
                    >
                      {activeMission ? t('busy') || 'Busy' : t('acceptMission')}
                    </Button>
                    <Button size="sm" variant="ghost" color="brand.300" borderRadius="10px" leftIcon={<FiMessageCircle />} onClick={() => { localStorage.setItem('activeEmergencyId', em._id); navigate('/chat'); }}>{t('viewDetails')}</Button>
                  </HStack>
                </Box>
              ))}
              {emergencies.filter(e => !e.assignedDriver && (e.assignedDoctor || e.transportType === 'cab')).length === 0 && <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)"><Text color="whiteAlpha.400">{t('noAvailableMissions')}</Text></Box>}
            </VStack>
          )}
        </MotionBox>

        {/* Recent Trips */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <HStack mb={4}><FiClock color="rgba(255,255,255,0.4)" /><Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('recentTrips')}</Text></HStack>
          <VStack spacing={3} align="stretch">
            {myMissions.filter(e => e.status === 'resolved').map((em) => (
              <Box key={em._id} bg="rgba(15,20,40,0.4)" border="1px solid rgba(255,255,255,0.04)" borderRadius="16px" p={5}>
                <Flex justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack><FiCheckCircle color="#38a169" /><Text fontWeight="600" fontSize="sm">{em.patientName}</Text><Text fontSize="xs" color="whiteAlpha.400">{em.location}</Text></HStack>
                  <HStack><Badge colorScheme="green" fontSize="10px">{t('completedBadge')}</Badge><Text fontSize="xs" color="whiteAlpha.300">{new Date(em.updatedAt).toLocaleDateString()}</Text></HStack>
                </Flex>
              </Box>
            ))}
            {myMissions.filter(e => e.status === 'resolved').length === 0 && <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)"><Text color="whiteAlpha.400">{t('noCompletedTrips')}</Text></Box>}
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default DriverDashboard;
