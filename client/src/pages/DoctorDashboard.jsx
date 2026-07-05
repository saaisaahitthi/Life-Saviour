import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Heading, SimpleGrid, Badge, Container, useToast, Flex, Spinner, Tabs, TabList, Tab, TabPanels, TabPanel, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Divider, Icon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiActivity, FiMessageCircle, FiMapPin, FiClock, FiUser, FiHeart, FiCheckCircle, FiBookOpen, FiFileText, FiTruck, FiAlertCircle, FiVideo } from 'react-icons/fi';
import { MdLocalHospital, MdEmergency } from 'react-icons/md';
import { emergencyService } from '../services/api';
import VideoCall from '../components/VideoCall';
import Timeline from '../components/Timeline';
import AIChatAssistant from '../components/AIChatAssistant';
import DynamicText from '../components/DynamicText';
import SmartHospitalPanel from '../components/SmartHospitalPanel';
import { useLanguage } from '../contexts/LanguageContext';
import DocumentManager from '../components/DocumentManager';
import { getSocket, joinEmergencyRoom, leaveEmergencyRoom, joinHospitalRoom } from '../services/socket';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ambulanceIcon = new L.divIcon({
  html: '<div style="font-size: 24px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4)); animation: pulse 2s infinite;">🚑</div>',
  className: 'custom-ambulance-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const patientIcon = new L.divIcon({
  html: '<div style="font-size: 24px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">📍</div>',
  className: 'custom-patient-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const hospitalIcon = new L.divIcon({
  html: '<div style="font-size: 24px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">🏥</div>',
  className: 'custom-hospital-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const MapUpdater = ({ bounds, center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bounds && bounds.length > 0) {
        try { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 }); } catch (e) {}
      } else if (center) {
        map.setView(center, map.getZoom());
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [bounds, center, map]);
  return null;
};

const DoctorLiveMap = ({ emergency }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const { t } = useLanguage();
  
  useEffect(() => {
    if (['assigned', 'in_progress'].includes(emergency.status)) {
      joinEmergencyRoom(emergency._id);
      const socket = getSocket();
      
      const handleLocationUpdate = (data) => {
        setDriverLocation([data.lat, data.lng]);
      };

      socket.on('location_update', handleLocationUpdate);

      return () => {
        socket.off('location_update', handleLocationUpdate);
        leaveEmergencyRoom(emergency._id);
      };
    }
  }, [emergency]);

  if (!emergency.coordinates?.lat) return null;

  return (
    <Box mt={4} mb={4} h="250px" borderRadius="16px" overflow="hidden" border="1px solid rgba(0,128,230,0.3)">
      <MapContainer center={[emergency.coordinates.lat, emergency.coordinates.lng]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
        
        <MapUpdater 
          bounds={(() => {
            const pts = [[emergency.coordinates.lat, emergency.coordinates.lng]];
            if (driverLocation) pts.push(driverLocation);
            const hLat = emergency.assignedHospital?.location?.coordinates?.lat || (emergency.coordinates.lat + 0.02);
            const hLng = emergency.assignedHospital?.location?.coordinates?.lng || (emergency.coordinates.lng + 0.02);
            pts.push([hLat, hLng]);
            return pts;
          })()}
          center={!driverLocation ? [emergency.coordinates.lat, emergency.coordinates.lng] : null}
        />
        
        {driverLocation && (
          <Marker position={driverLocation} icon={ambulanceIcon}><Popup>🚑 Ambulance</Popup></Marker>
        )}
        <Marker position={[emergency.coordinates.lat, emergency.coordinates.lng]} icon={patientIcon}><Popup>📍 Patient</Popup></Marker>
        {(() => {
          const hLat = emergency.assignedHospital?.location?.coordinates?.lat || (emergency.coordinates.lat + 0.02);
          const hLng = emergency.assignedHospital?.location?.coordinates?.lng || (emergency.coordinates.lng + 0.02);
          const hName = emergency.assignedHospital?.name || 'City General (Test)';
          return <Marker position={[hLat, hLng]} icon={hospitalIcon}><Popup>🏥 {hName}</Popup></Marker>;
        })()}

        {driverLocation && <Polyline positions={[driverLocation, [emergency.coordinates.lat, emergency.coordinates.lng]]} color="#0080e6" weight={4} dashArray="8, 8" />}
        {(() => {
          const hLat = emergency.assignedHospital?.location?.coordinates?.lat || (emergency.coordinates.lat + 0.02);
          const hLng = emergency.assignedHospital?.location?.coordinates?.lng || (emergency.coordinates.lng + 0.02);
          return <Polyline positions={[[emergency.coordinates.lat, emergency.coordinates.lng], [hLat, hLng]]} color="#38a169" weight={4} dashArray="8, 8" />;
        })()}
      </MapContainer>
    </Box>
  );
};

const MotionBox = motion(Box);

const DoctorDashboard = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [myEmergencies, setMyEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen: isProtocolsOpen, onOpen: onProtocolsOpen, onClose: onProtocolsClose } = useDisclosure();
  const { isOpen: isChartOpen, onOpen: onChartOpen, onClose: onChartClose } = useDisclosure();
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const userName = localStorage.getItem('userName') || 'Doctor';
  const userHospital = localStorage.getItem('userHospital');

  useEffect(() => { 
    fetchData(); 
    const socket = getSocket();
    if (socket) {
      if (userHospital) {
        joinHospitalRoom(userHospital);
      }
      const handleUpdate = (data) => {
        if (data && data.status === 'dropped_off') {
          // Check if it belongs to this doctor by checking the ID directly instead of state (prevents stale closure bug)
          const myId = localStorage.getItem('userId');
          const docId = data.assignedDoctor?._id || data.assignedDoctor;
          
          if (docId === myId) {
            toast({
              title: "🚨 Ambulance Arrived!",
              description: `Driver ${data.assignedDriver?.name || 'the driver'} has dropped off patient ${data.patientName} at your hospital!`,
              status: "warning",
              duration: 10000,
              isClosable: true,
              position: "top",
              icon: <FiTruck />
            });
          }
        }
        fetchData();
      };
      socket.on('new_emergency', fetchData);
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
      setMyEmergencies(my.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAccept = async (id) => {
    try {
      await emergencyService.assignDoctor(id);
      toast({ title: t('emergencyAccepted'), description: t('assignedToEmergency'), status: 'success', duration: 3000, position: 'top-right' });
      fetchData();
    } catch (err) { toast({ title: 'Error', description: err.response?.data?.message || 'Failed', status: 'error', duration: 3000, position: 'top-right' }); }
  };

  const handleResolve = async (id) => {
    try {
      await emergencyService.resolve(id, 'Resolved by doctor');
      toast({ title: t('emergencyResolved'), status: 'success', duration: 3000, position: 'top-right' });
      fetchData();
    } catch (err) { toast({ title: 'Error', status: 'error', duration: 3000, position: 'top-right' }); }
  };

  const getSevColor = (s) => s === 'critical' ? '#e53e3e' : s === 'medium' ? '#d69e2e' : '#38a169';
  const getStatusColor = (s) => s === 'resolved' ? 'green' : s === 'in_progress' ? 'blue' : s === 'assigned' ? 'orange' : 'yellow';

  const openPatientChart = (emergency) => {
    setSelectedPatient(emergency);
    joinEmergencyRoom(emergency._id);
    onChartOpen();
  };

  const handleChartClose = () => {
    if (selectedPatient) leaveEmergencyRoom(selectedPatient._id);
    setSelectedPatient(null);
    onChartClose();
  };

  // Listen for real-time wearable updates
  useEffect(() => {
    const s = getSocket();
    s.on('wearable_update', (vitals) => {
      setSelectedPatient(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          wearableSnapshot: vitals
        };
      });
    });
    return () => {
      s.off('wearable_update');
    };
  }, []);

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px">
      <Box position="fixed" top="-20%" left="-15%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(0,128,230,0.05) 0%, transparent 70%)" filter="blur(60px)" pointerEvents="none" />
      <Container maxW="1300px" py={8} px={{ base: 4, md: 8 }}>
        {/* Header */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} mb={8}>
          <Flex justify="space-between" flexWrap="wrap" gap={4} align="center">
            <Box>
              <Text fontSize="sm" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="1px">{t('doctorWorkspace')}</Text>
              <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800">Dr. {userName}</Heading>
            </Box>
            <HStack spacing={4}>
              <Button leftIcon={<FiBookOpen />} variant="outline" colorScheme="teal" size="sm" borderRadius="10px" onClick={onProtocolsOpen}>{t('clinicalGuidelines')}</Button>
              <HStack spacing={3} bg="rgba(56,161,105,0.1)" border="1px solid rgba(56,161,105,0.3)" px={4} py={2} borderRadius="12px">
                <Box w={2} h={2} borderRadius="full" bg="#38a169" boxShadow="0 0 8px #38a169" />
                <Text fontSize="xs" color="green.300" fontWeight="700">{t('systemActive')}</Text>
              </HStack>
            </HStack>
          </Flex>
        </MotionBox>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          {[
            { label: t('activeCases'), value: emergencies.length, icon: MdEmergency, color: '#e53e3e' },
            { label: t('myAssigned'), value: myEmergencies.filter(e => e.status !== 'resolved').length, icon: FiActivity, color: '#0080e6' },
            { label: t('resolved'), value: myEmergencies.filter(e => e.status === 'resolved').length, icon: FiCheckCircle, color: '#38a169' },
            { label: t('totalHandled'), value: myEmergencies.length, icon: FiHeart, color: '#00bcd4' },
          ].map((stat, i) => (
            <MotionBox key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={5}>
                <HStack justify="space-between" mb={2}><Box w="36px" h="36px" borderRadius="10px" bg={`${stat.color}15`} display="flex" alignItems="center" justifyContent="center"><stat.icon color={stat.color} size={18} /></Box></HStack>
                <Text fontSize="2xl" fontWeight="800">{stat.value}</Text>
                <Text fontSize="xs" color="whiteAlpha.400" fontWeight="600">{stat.label}</Text>
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>

        <Tabs variant="unstyled" colorScheme="brand" isLazy>
          <TabList bg="rgba(15,20,40,0.6)" borderRadius="14px" p={1} border="1px solid rgba(255,255,255,0.06)" mb={6}>
            <Tab borderRadius="12px" fontSize="sm" fontWeight="600" color="whiteAlpha.500" _selected={{ bg: 'rgba(0,128,230,0.2)', color: 'brand.300' }} px={6}>{t('activeEmergencies')}</Tab>
            <Tab borderRadius="12px" fontSize="sm" fontWeight="600" color="whiteAlpha.500" _selected={{ bg: 'rgba(0,128,230,0.2)', color: 'brand.300' }} px={6}>{t('myCases')}</Tab>
            <Tab borderRadius="12px" fontSize="sm" fontWeight="600" color="whiteAlpha.500" _selected={{ bg: 'rgba(0,128,230,0.2)', color: 'brand.300' }} px={6}>{t('history')}</Tab>
          </TabList>
          <TabPanels>
            {/* Active Emergencies */}
            <TabPanel p={0}>
              {loading ? <Flex justify="center" py={10}><Spinner color="brand.400" /></Flex> : emergencies.length === 0 ? (
                <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)"><Text color="whiteAlpha.400">{t('noActiveEmergencies')}</Text></Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {emergencies.filter(e => e.transportType !== 'cab').map((em) => (
                    <MotionBox key={em._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} bg="rgba(15,20,40,0.6)" border={`1px solid ${em.severity === 'critical' ? 'rgba(229,62,62,0.3)' : 'rgba(255,255,255,0.06)'}`} borderRadius="20px" p={6} _hover={{ border: '1px solid rgba(0,128,230,0.3)' }} transition="all 0.3s">
                      <Flex justify="space-between" flexWrap="wrap" gap={4} mb={4}>
                        <HStack spacing={3}>
                          <Box w="44px" h="44px" borderRadius="12px" bg={`${getSevColor(em.severity)}15`} display="flex" alignItems="center" justifyContent="center"><FiActivity color={getSevColor(em.severity)} size={20} /></Box>
                          <Box>
                            <HStack><Text fontWeight="700">{em.patientName}</Text><Badge colorScheme={em.severity === 'critical' ? 'red' : em.severity === 'medium' ? 'orange' : 'green'} fontSize="10px" borderRadius="6px">{em.severity.toUpperCase()}</Badge></HStack>
                            <Text fontSize="xs" color="whiteAlpha.400">{new Date(em.createdAt).toLocaleString()}</Text>
                          </Box>
                        </HStack>
                        <Badge colorScheme={getStatusColor(em.status)} fontSize="10px" px={3} py={1} borderRadius="8px" h="fit-content">{em.status.replace('_', ' ').toUpperCase()}</Badge>
                      </Flex>
                      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
                        <Box><Text fontSize="xs" color="whiteAlpha.400">{t('ageGender')}</Text><Text fontSize="sm">{em.age} / {em.gender}</Text></Box>
                        <Box><Text fontSize="xs" color="whiteAlpha.400">{t('bloodGroup')}</Text><Text fontSize="sm">{em.bloodGroup}</Text></Box>
                        <Box><Text fontSize="xs" color="whiteAlpha.400">{t('locationLabel')}</Text><Text fontSize="sm">{em.location}</Text></Box>
                        <Box><Text fontSize="xs" color="whiteAlpha.400">{t('symptoms')}</Text><Text fontSize="sm" noOfLines={2}>{em.symptoms}</Text></Box>
                      </SimpleGrid>

                      {em.aiTriage && (
                        <Box bg="rgba(0,188,212,0.1)" border="1px solid rgba(0,188,212,0.2)" borderRadius="14px" p={4} mb={4}>
                          <HStack justify="space-between" mb={2}>
                            <HStack>
                              <Icon as={FiActivity} color="cyan.300" size={14} />
                              <Text fontSize="xs" fontWeight="800" color="cyan.300">{t('aiTriageAnalysis')}</Text>
                            </HStack>
                            <Badge colorScheme="cyan" variant="subtle" fontSize="9px">SCORE: {em.aiTriage.severityScore}/10</Badge>
                          </HStack>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            <Box><Text fontSize="10px" color="whiteAlpha.500">{t('categoryLabel')}</Text><Text fontSize="xs" fontWeight="700">{em.aiTriage.category?.toUpperCase()}</Text></Box>
                            <Box><Text fontSize="10px" color="whiteAlpha.500">{t('recommendedDept')}</Text><Text fontSize="xs" fontWeight="700">{em.aiTriage.recommendedDepartment}</Text></Box>
                          </SimpleGrid>
                          <Text mt={2} fontSize="xs" color="whiteAlpha.600">"{em.aiTriage.analysisSummary}"</Text>
                        </Box>
                      )}
                      <HStack spacing={3} flexWrap="wrap">
                        {!em.assignedDoctor && <Button size="sm" bg="linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)" color="white" borderRadius="10px" onClick={() => handleAccept(em._id)} _hover={{ transform: 'translateY(-1px)' }}>{t('acceptEmergency')}</Button>}
                        <VideoCall 
                          emergencyId={em._id} 
                          userId={localStorage.getItem('userId')} 
                          remoteId={em.patientId?._id || em.patientId} 
                          userName={userName} 
                          remoteName={em.patientName} 
                          role="doctor" 
                        />
                        <Button size="sm" bg="rgba(255,255,255,0.1)" color="white" borderRadius="10px" leftIcon={<FiFileText />} onClick={() => openPatientChart(em)} _hover={{ bg: 'rgba(255,255,255,0.2)' }}>{t('viewChart')}</Button>
                        <Button size="sm" variant="ghost" color="brand.300" borderRadius="10px" leftIcon={<FiMessageCircle />} onClick={() => { localStorage.setItem('activeEmergencyId', em._id); navigate('/chat'); }} _hover={{ bg: 'rgba(0,128,230,0.1)' }}>{t('joinChat')}</Button>
                      </HStack>
                    </MotionBox>
                  ))}
                </VStack>
              )}
            </TabPanel>
            {/* My Cases */}
            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {myEmergencies.filter(e => e.status !== 'resolved').map((em) => (
                  <Box key={em._id} bg="rgba(15,20,40,0.6)" border="1px solid rgba(0,128,230,0.15)" borderRadius="20px" p={6}>
                    <Flex justify="space-between" flexWrap="wrap" gap={3} mb={3}>
                      <HStack><FiUser color="#0080e6" /><Text fontWeight="700">{em.patientName}</Text><Badge colorScheme={em.severity === 'critical' ? 'red' : 'orange'} fontSize="10px">{em.severity}</Badge></HStack>
                      <Badge colorScheme={getStatusColor(em.status)} fontSize="10px" px={3} py={1} borderRadius="8px">{em.status.replace('_', ' ')}</Badge>
                    </Flex>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
                      <Box><Text fontSize="xs" color="whiteAlpha.400">{t('age')}</Text><Text fontSize="sm">{em.age}</Text></Box>
                      <Box><Text fontSize="xs" color="whiteAlpha.400">{t('blood')}</Text><Text fontSize="sm">{em.bloodGroup}</Text></Box>
                      <Box><Text fontSize="xs" color="whiteAlpha.400">{t('locationLabel')}</Text><Text fontSize="sm">{em.location}</Text></Box>
                      <Box><Text fontSize="xs" color="whiteAlpha.400">{t('dispatch')}</Text>
                        <HStack mt={1}>
                          {em.assignedDriver ? (
                            <Badge colorScheme="blue" display="flex" alignItems="center" gap={1}><FiTruck /> {t('enRouteBadge')}</Badge>
                          ) : (
                            <Badge colorScheme="orange" display="flex" alignItems="center" gap={1}><FiAlertCircle /> {t('waitingBadge')}</Badge>
                          )}
                        </HStack>
                      </Box>
                    </SimpleGrid>
                    
                    {['assigned', 'in_progress'].includes(em.status) && (
                      <DoctorLiveMap emergency={em} />
                    )}

                    <HStack spacing={3}>
                      <Button size="sm" bg="rgba(255,255,255,0.1)" color="white" borderRadius="10px" leftIcon={<FiFileText />} onClick={() => openPatientChart(em)}>{t('viewChart')}</Button>
                      <Button size="sm" bg="rgba(0,128,230,0.15)" color="brand.300" borderRadius="10px" leftIcon={<FiMessageCircle />} onClick={() => { localStorage.setItem('activeEmergencyId', em._id); navigate('/chat'); }}>{t('chat')}</Button>
                      <Button size="sm" bg="rgba(56,161,105,0.15)" color="green.300" borderRadius="10px" leftIcon={<FiCheckCircle />} onClick={() => handleResolve(em._id)}>{t('resolve')}</Button>
                    </HStack>
                  </Box>
                ))}
                {myEmergencies.filter(e => e.status !== 'resolved').length === 0 && <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)"><Text color="whiteAlpha.400">{t('noActiveCases')}</Text></Box>}
              </VStack>
            </TabPanel>
            {/* History */}
            <TabPanel p={0}>
              <VStack spacing={3} align="stretch">
                {myEmergencies.filter(e => e.status === 'resolved').map((em) => (
                  <Box key={em._id} bg="rgba(15,20,40,0.4)" border="1px solid rgba(255,255,255,0.04)" borderRadius="16px" p={5}>
                    <Flex justify="space-between" flexWrap="wrap" gap={3}>
                      <HStack><FiCheckCircle color="#38a169" /><Text fontWeight="600" fontSize="sm">{em.patientName}</Text><DynamicText as="p" fontSize="xs" color="whiteAlpha.400" text={em.symptoms?.substring(0, 40)} /></HStack>
                      <HStack><Badge colorScheme="green" fontSize="10px">{t('resolvedBadge')}</Badge><Text fontSize="xs" color="whiteAlpha.300">{new Date(em.resolvedAt || em.updatedAt).toLocaleDateString()}</Text></HStack>
                    </Flex>
                  </Box>
                ))}
                {myEmergencies.filter(e => e.status === 'resolved').length === 0 && <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)"><Text color="whiteAlpha.400">{t('noResolvedCases')}</Text></Box>}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* Clinical Guidelines Modal */}
      <Modal isOpen={isProtocolsOpen} onClose={onProtocolsClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px">
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)">
            <HStack><Box bg="rgba(0,188,212,0.15)" p={2} borderRadius="10px"><FiBookOpen color="#00bcd4" /></Box><Text>{t('clinicalGuidelinesProtocols')}</Text></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <Accordion allowMultiple>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3} p={1}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600">{t('aclsTitle')}</Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} fontSize="sm" color="whiteAlpha.700" whiteSpace="pre-line">
                  <Text fontWeight="bold" color="red.300" mb={1}>{t('cardiacArrestAlgo')}</Text>
                  {t('aclsSteps')}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3} p={1}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600">{t('atlsTitle')}</Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} fontSize="sm" color="whiteAlpha.700" whiteSpace="pre-line">
                  <Text fontWeight="bold" color="orange.300" mb={1}>{t('primarySurvey')}</Text>
                  {t('atlsSteps')}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3} p={1}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600">{t('commonAntidotes')}</Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} fontSize="sm" color="whiteAlpha.700" whiteSpace="pre-line">
                  {t('antidotesContent')}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </ModalBody>
        </ModalContent>
      </Modal>

        {/* Selected Patient Chart Modal */}
        <Modal isOpen={isChartOpen} onClose={() => { leaveEmergencyRoom(selectedPatient?._id); onChartClose(); }} size="3xl" scrollBehavior="inside">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px">
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)">
            <HStack><Box bg="rgba(0,128,230,0.15)" p={2} borderRadius="10px"><FiFileText color="#0080e6" /></Box><Text>{t('patientChart')}</Text></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            {selectedPatient && (
              <VStack align="stretch" spacing={5}>
                <HStack justify="space-between" bg="rgba(255,255,255,0.03)" p={4} borderRadius="16px">
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.400">{t('patientName')}</Text>
                    <Text fontSize="lg" fontWeight="bold">{selectedPatient.patientName}</Text>
                  </Box>
                  <Badge colorScheme={selectedPatient.severity === 'critical' ? 'red' : 'orange'} px={3} py={1} borderRadius="md">{selectedPatient.severity.toUpperCase()}</Badge>
                </HStack>
                <SimpleGrid columns={2} spacing={4}>
                  <Box bg="rgba(255,255,255,0.02)" p={3} borderRadius="12px">
                    <Text fontSize="xs" color="whiteAlpha.400" mb={1}>{t('ageGender')}</Text>
                    <Text fontWeight="600">{selectedPatient.age} / {selectedPatient.gender}</Text>
                  </Box>
                  <Box bg="rgba(229,62,62,0.1)" p={3} borderRadius="12px" border="1px solid rgba(229,62,62,0.2)">
                    <Text fontSize="xs" color="red.300" mb={1}>{t('bloodGroup')}</Text>
                    <Text fontWeight="bold" color="red.400" fontSize="lg">{selectedPatient.bloodGroup}</Text>
                  </Box>
                </SimpleGrid>
                <Box>
                  <Text fontSize="sm" color="whiteAlpha.500" mb={2} fontWeight="600">{t('chiefComplaint')}</Text>
                  <Box bg="rgba(255,255,255,0.03)" p={4} borderRadius="12px" fontSize="sm">
                    <DynamicText as="span" text={selectedPatient.symptoms} />
                  </Box>
                </Box>
                <Box>
                  <Text fontSize="sm" color="teal.300" mb={2} fontWeight="600">{t('medicalIdNotes')}</Text>
                  <Box bg="rgba(0,188,212,0.1)" border="1px solid rgba(0,188,212,0.2)" p={4} borderRadius="12px" fontSize="sm" whiteSpace="pre-wrap">
                    <DynamicText as="span" text={selectedPatient.additionalNotes || t('noMedicalHistory')} />
                  </Box>
                </Box>
                {selectedPatient.aiTriage && (
                  <Box bg="rgba(0,188,212,0.05)" border="1px dashed rgba(0,188,212,0.3)" p={4} borderRadius="12px">
                    <Text fontSize="sm" color="cyan.300" mb={2} fontWeight="600">{t('aiDiagnostic')}</Text>
                    <DynamicText as="p" fontSize="xs" color="whiteAlpha.700" text={selectedPatient.aiTriage.analysisSummary} />
                    <HStack mt={3}>
                      <Badge colorScheme="cyan">{t('scoreLabel')}: {selectedPatient.aiTriage.severityScore}</Badge>
                      <Badge colorScheme="teal">{t('deptLabel')}: {selectedPatient.aiTriage.recommendedDepartment}</Badge>
                    </HStack>
                  </Box>
                )}

                {/* Wearable Vitals at SOS Time */}
                {selectedPatient.wearableSnapshot?.heartRate && (
                  <Box bg="rgba(229,62,62,0.05)" border="1px solid rgba(229,62,62,0.3)" borderRadius="14px" p={4} mt={3}>
                    <HStack mb={3}>
                      <Icon as={FiActivity} color="red.400" />
                      <Text fontSize="sm" color="red.400" fontWeight="700">Wearable Vitals (At Time of SOS)</Text>
                    </HStack>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box bg="rgba(0,0,0,0.2)" p={3} borderRadius="8px">
                        <Text fontSize="xs" color="whiteAlpha.500">Heart Rate</Text>
                        <Text fontSize="lg" color="white" fontWeight="800">{selectedPatient.wearableSnapshot.heartRate} <Text as="span" fontSize="xs" color="whiteAlpha.400">BPM</Text></Text>
                      </Box>
                      <Box bg="rgba(0,0,0,0.2)" p={3} borderRadius="8px">
                        <Text fontSize="xs" color="whiteAlpha.500">SpO2</Text>
                        <Text fontSize="lg" color="white" fontWeight="800">{selectedPatient.wearableSnapshot.bloodOxygen} <Text as="span" fontSize="xs" color="whiteAlpha.400">%</Text></Text>
                      </Box>
                      <Box bg="rgba(0,0,0,0.2)" p={3} borderRadius="8px">
                        <Text fontSize="xs" color="whiteAlpha.500">Blood Pressure</Text>
                        <Text fontSize="lg" color="white" fontWeight="800">{selectedPatient.wearableSnapshot.bloodPressure} <Text as="span" fontSize="xs" color="whiteAlpha.400">mmHg</Text></Text>
                      </Box>
                      <Box bg="rgba(0,0,0,0.2)" p={3} borderRadius="8px">
                        <Text fontSize="xs" color="whiteAlpha.500">Temperature</Text>
                        <Text fontSize="lg" color="white" fontWeight="800">{selectedPatient.wearableSnapshot.temperature} <Text as="span" fontSize="xs" color="whiteAlpha.400">°C</Text></Text>
                      </Box>
                    </SimpleGrid>
                  </Box>
                )}

                {selectedPatient.aiTriage?.chatSummary && (
                  <Box bg="rgba(0,128,230,0.08)" border="1px solid rgba(0,128,230,0.2)" borderRadius="14px" p={4}>
                    <HStack mb={2}>
                      <Icon as={FiMessageCircle} color="brand.300" />
                      <Text fontSize="sm" color="brand.300" fontWeight="700">{t('aiPreTriageSummary')}</Text>
                    </HStack>
                    <Box bg="rgba(255,255,255,0.03)" p={3} borderRadius="10px" fontSize="xs" color="whiteAlpha.800" whiteSpace="pre-wrap" lineHeight="1.8">
                      <DynamicText as="span" text={selectedPatient.aiTriage.chatSummary} />
                    </Box>
                    <Text mt={2} fontSize="9px" color="whiteAlpha.300" fontStyle="italic">{t('autoGeneratedNote')}</Text>
                  </Box>
                )}

                {/* Smart Hospital AI Recommendation */}
                <Box mt={2}>
                  <SmartHospitalPanel emergencyId={selectedPatient._id} />
                </Box>

                {/* Feature 9: Case Audit Timeline */}
                <Box mt={2} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
                  <Text fontSize="sm" color="whiteAlpha.500" mb={4} fontWeight="600">{t('caseAuditTimeline')}</Text>
                  <Timeline emergencyId={selectedPatient._id} />
                </Box>

                {/* Feature 10: AI Chat (Doctor read-only view) */}
                <Box mt={2}>
                  <AIChatAssistant emergencyId={selectedPatient._id} isDoctorView={true} />
                </Box>

                {/* Document Manager */}
                <Box mt={2}>
                  <DocumentManager 
                    emergencyId={selectedPatient._id} 
                    initialAttachments={selectedPatient.attachments} 
                    role="doctor" 
                  />
                </Box>
                
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default DoctorDashboard;
