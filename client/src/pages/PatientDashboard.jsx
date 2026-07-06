import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Heading, SimpleGrid, Badge, Container, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, Textarea, useToast, Icon, Flex, Spinner, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiMessageCircle, FiMapPin, FiPhone, FiClock, FiChevronRight, FiUser, FiHeart, FiActivity, FiTruck, FiMic } from 'react-icons/fi';
import { MdLocalHospital, MdEmergency } from 'react-icons/md';
import { emergencyService } from '../services/api';
import { getSocket, joinEmergencyRoom, leaveEmergencyRoom } from '../services/socket';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SOSButton from '../components/SOSButton';
import VoiceEmergencyAssistant from '../components/VoiceEmergencyAssistant';
import AIChatAssistant from '../components/AIChatAssistant';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineService } from '../services/offlineService';
import { FiWifi, FiWifiOff, FiUploadCloud } from 'react-icons/fi';
import WearableHealthMonitor from '../components/WearableHealthMonitor';
import FamilyContactManager from '../components/FamilyContactManager';
import { useLanguage } from '../contexts/LanguageContext';
import TransliterateInput from '../components/TransliterateInput';
import FirstAidGuide from '../components/FirstAidGuide';
import MedicalQrCode from '../components/MedicalQrCode';
import { useOSRMRoute } from '../hooks/useOSRMRoute';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ambulanceIcon = new L.divIcon({
  html: '<div style="font-size: 36px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4)); animation: pulse 2s infinite;">🚑</div>',
  className: 'custom-ambulance-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const patientIcon = new L.divIcon({
  html: '<div style="font-size: 36px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">📍</div>',
  className: 'custom-patient-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const hospitalIcon = new L.divIcon({
  html: '<div style="font-size: 36px; line-height: 1; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));">🏥</div>',
  className: 'custom-hospital-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const MotionBox = motion(Box);

// Helper component to dynamically update map view
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

const PatientDashboard = () => {
  const { t } = useLanguage();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isHospitalsOpen, onOpen: onHospitalsOpen, onClose: onHospitalsClose } = useDisclosure();
  const { isOpen: isFirstAidOpen, onOpen: onFirstAidOpen, onClose: onFirstAidClose } = useDisclosure();
  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { isOnline, syncing } = useOfflineSync();
  const userName = localStorage.getItem('userName') || 'Patient';

  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('medicalProfile')) || {
    bloodGroup: 'O+', allergies: '', medications: '', emergencyContact: ''
  });
  const [driverLocation, setDriverLocation] = useState(null);

  const [form, setForm] = useState({ 
    patientName: userName, 
    age: '', 
    gender: 'male', 
    bloodGroup: profile.bloodGroup, 
    location: '', 
    coordinates: null,
    severity: 'medium', 
    symptoms: '', 
    additionalNotes: `Allergies: ${profile.allergies}\nMedications: ${profile.medications}`, 
    transportType: 'ambulance',
    triageInputs: {
      breathingDifficulty: 5,
      painLevel: 5,
      consciousnessState: 'conscious'
    }
  });

  useEffect(() => { fetchEmergencies(); }, []);

  const fetchEmergencies = async () => {
    try {
      const { data } = await emergencyService.getMy();
      setEmergencies(data);
      if (data.length > 0) {
        localStorage.setItem('activeEmergencyId', data[0]._id);
      } else {
        localStorage.removeItem('activeEmergencyId');
      }
      setLoading(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('medicalProfile', JSON.stringify(profile));
    toast({ title: t('profileSaved'), status: 'success', duration: 2000, position: 'top-right' });
    onProfileClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    if (!isOnline) {
      try {
        await offlineService.queueEmergency(form);
        toast({ 
          title: t('offlineModeActive'), 
          description: t('offlineQueueDesc'), 
          status: 'warning', 
          duration: 6000, 
          position: 'top' 
        });
        onClose();
      } catch (err) {
        toast({ title: t('error'), description: t('failed'), status: 'error' });
      } finally {
        setFormLoading(false);
      }
      return;
    }

    try {
      // Attach wearable snapshot if a device is connected
      const wearableRaw = localStorage.getItem('connectedWearable');
      const wearableSnapshot = wearableRaw ? JSON.parse(wearableRaw) : null;
      const payload = { ...form, ...(wearableSnapshot ? { wearableSnapshot } : {}) };

      const { data } = await emergencyService.create(payload);
      toast({ title: t('emergencyReported'), description: t('helpOnWay'), status: 'success', duration: 4000, position: 'top-right' });
      onClose();
      localStorage.setItem('activeEmergencyId', data._id);
      navigate('/chat');
    } catch (err) {
      toast({ title: t('failed'), description: err.response?.data?.message || 'Error reporting emergency', status: 'error', duration: 4000, position: 'top-right' });
    } finally { setFormLoading(false); }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: t('notSupported'), description: t('geoNotSupported'), status: 'error', duration: 3000, position: 'top-right' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          setForm({ 
            ...form, 
            location: data.display_name || `${latitude}, ${longitude}`,
            coordinates: { lat: latitude, lng: longitude }
          });
          toast({ title: t('locationDetected'), status: 'success', duration: 2000, position: 'top-right' });
        } catch (err) {
          setForm({ 
            ...form, 
            location: `${latitude}, ${longitude}`,
            coordinates: { lat: latitude, lng: longitude }
          });
        }
      },
      () => {
        toast({ title: t('locationError'), description: t('couldNotDetect'), status: 'error', duration: 3000, position: 'top-right' });
      }
    );
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTriageChange = (e) => setForm({ 
    ...form, 
    triageInputs: { ...form.triageInputs, [e.target.name]: e.target.value } 
  });

  const getSeverityColor = (s) => s === 'critical' ? 'red' : s === 'medium' ? 'orange' : 'green';
  const getStatusColor = (s) => s === 'resolved' ? 'green' : s === 'in_progress' ? 'blue' : s === 'assigned' ? 'orange' : s === 'cancelled' ? 'gray' : 'yellow';

  const activeEmergency = emergencies.find(e => ['pending', 'assigned', 'in_progress', 'arrived'].includes(e.status));

  useEffect(() => {
    if (activeEmergency && ['assigned', 'in_progress', 'arrived'].includes(activeEmergency.status)) {
      joinEmergencyRoom(activeEmergency._id);
      const socket = getSocket();
      
      const handleLocationUpdate = (data) => {
        setDriverLocation([data.lat, data.lng]);
      };

      socket.on('location_update', handleLocationUpdate);

      return () => {
        socket.off('location_update', handleLocationUpdate);
        leaveEmergencyRoom(activeEmergency._id);
      };
    }
  }, [activeEmergency]);

  const driverCoord = driverLocation ? { lat: driverLocation[0], lng: driverLocation[1] } : null;
  const patientCoord = activeEmergency?.coordinates;
  const hospitalCoord = activeEmergency ? {
    lat: activeEmergency.assignedHospital?.location?.coordinates?.lat || (patientCoord.lat + 0.02),
    lng: activeEmergency.assignedHospital?.location?.coordinates?.lng || (patientCoord.lng + 0.02)
  } : null;

  const { coordinates: driverToPatientRoute, duration: driverToPatientDuration } = useOSRMRoute(
    activeEmergency?.status === 'in_progress' ? driverCoord : null, 
    activeEmergency?.status === 'in_progress' ? patientCoord : null
  );
  const { coordinates: patientToHospitalRoute, duration: patientToHospitalDuration } = useOSRMRoute(patientCoord, hospitalCoord);

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px">
      <Box position="fixed" top="-20%" right="-15%" w="700px" h="700px" borderRadius="full" bg="radial-gradient(circle, rgba(229,62,62,0.05) 0%, transparent 70%)" filter="blur(60px)" pointerEvents="none" />
      <Container maxW="1200px" py={8} px={{ base: 4, md: 8 }}>
        {/* Welcome */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} mb={8}>
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <Box>
              <Text fontSize="sm" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="1px">{t('patientDashboard')}</Text>
              <Heading fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800">{t('welcome')}, {userName}</Heading>
            </Box>
            <HStack spacing={4}>
              <Badge 
                colorScheme={isOnline ? 'green' : 'red'} 
                variant="subtle" 
                px={3} 
                py={1} 
                borderRadius="full"
              >
                <HStack spacing={1}>
                  <Icon as={isOnline ? FiWifi : FiWifiOff} />
                  <Text fontSize="10px">{isOnline ? t('online') : t('offline')}</Text>
                </HStack>
              </Badge>
              {syncing && (
                <Badge colorScheme="blue" variant="solid" px={3} py={1} borderRadius="full" className="pulse-animation">
                  <HStack spacing={1}>
                    <Icon as={FiActivity} />
                    <Text fontSize="10px">{t('syncing')}</Text>
                  </HStack>
                </Badge>
              )}
              <Button leftIcon={<FiUser />} variant="outline" colorScheme="blue" size="sm" borderRadius="10px" onClick={onProfileOpen}>{t('medicalId')}</Button>
            </HStack>
          </HStack>
        </MotionBox>

        {/* Hero Emergency Card */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} mb={8}>
          <Box bg="linear-gradient(135deg, rgba(229,62,62,0.15) 0%, rgba(0,128,230,0.1) 50%, rgba(0,188,212,0.08) 100%)" border="1px solid rgba(229,62,62,0.2)" borderRadius="24px" p={{ base: 6, md: 10 }} position="relative" overflow="hidden">
            <Box position="absolute" top="0" left="0" right="0" h="2px" bgGradient="linear(to-r, emergency.500, brand.500, teal.500)" />
            <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={6}>
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3} textAlign={{ base: 'center', md: 'left' }}>
                <HStack><Icon as={MdEmergency} boxSize={6} color="emergency.400" /><Text fontSize="xs" color="emergency.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('emergencyServices')}</Text></HStack>
                <Heading fontSize={{ base: 'xl', md: '3xl' }} fontWeight="900">{t('needImmediateHelp')}</Heading>
                <Text color="whiteAlpha.500" maxW="400px" fontSize="sm" lineHeight="1.7">{t('reportDesc')}</Text>
              </VStack>
              <Button onClick={onOpen} size="lg" bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)" color="white" px={8} h="60px" fontSize="md" fontWeight="800" borderRadius="16px" leftIcon={<FiAlertTriangle />} _hover={{ transform: 'translateY(-3px)', boxShadow: '0 12px 35px rgba(229,62,62,0.5)' }} transition="all 0.3s">🚨 {t('reportNow')}</Button>
            </Flex>
          </Box>
        </MotionBox>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5} mb={8}>
          {[
            { icon: FiMessageCircle, title: t('emergencyChatAction'), desc: t('joinLiveComm'), color: '#0080e6', onClick: () => {
                if (localStorage.getItem('activeEmergencyId')) navigate('/chat');
                else toast({ title: t('noActiveEmergencyTitle') || 'No Active Emergency', description: t('noActiveEmergencyDesc') || 'Please report an emergency first to access the live chat channel.', status: 'warning', duration: 4000, position: 'top-right' });
            } },
            { icon: FiHeart, title: t('firstAidGuides'), desc: t('immediateEmergencySteps'), color: '#e53e3e', onClick: onFirstAidOpen },
            { icon: MdLocalHospital, title: t('nearbyHospitals'), desc: t('findHospitalsNear'), color: '#00bcd4', onClick: onHospitalsOpen },
            { icon: FiPhone, title: t('emergencySupport'), desc: t('contactHelpline'), color: '#38a169', onClick: () => {
                toast({ title: t('callingEmergencySupport'), description: t('connectingHelpline'), status: 'info', duration: 3000, position: 'top-right' });
                window.location.href = 'tel:108';
            } },
          ].map((item, i) => (
            <MotionBox key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="20px" p={6} cursor="pointer" onClick={item.onClick} _hover={{ border: `1px solid ${item.color}33`, transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${item.color}15` }} transition="all 0.3s">
                <Box w="48px" h="48px" borderRadius="14px" bg={`${item.color}18`} display="flex" alignItems="center" justifyContent="center" mb={4}><Icon as={item.icon} boxSize={5} color={item.color} /></Box>
                <Text fontWeight="700" mb={1}>{item.title}</Text>
                <Text fontSize="sm" color="whiteAlpha.400">{item.desc}</Text>
                <HStack mt={4} color={item.color} fontSize="sm" fontWeight="600"><Text>{t('open')}</Text><FiChevronRight /></HStack>
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Active Emergency */}
        {activeEmergency && (
          <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} mb={8}>
            <Box bg="rgba(229,62,62,0.08)" border="1px solid rgba(229,62,62,0.2)" borderRadius="20px" p={6}>
              <HStack mb={4}>
                <Box w={2} h={2} borderRadius="full" bg="#e53e3e" boxShadow="0 0 8px #e53e3e" />
                <Text fontSize="xs" color="emergency.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('activeEmergencyLabel')}</Text>
                {activeEmergency.transportType === 'cab' && <Badge colorScheme="blue" ml={2}><FiTruck style={{ display: 'inline', marginRight: '4px' }} />{t('transportOnly')}</Badge>}
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box><Text fontSize="xs" color="whiteAlpha.400">{t('severityLabel')}</Text><Badge colorScheme={getSeverityColor(activeEmergency.severity)} mt={1} textTransform="uppercase">{activeEmergency.severity}</Badge></Box>
                <Box><Text fontSize="xs" color="whiteAlpha.400">{t('statusLabel')}</Text><Badge colorScheme={getStatusColor(activeEmergency.status)} mt={1} textTransform="uppercase">{activeEmergency.status.replace('_', ' ')}</Badge></Box>
                <Box><Text fontSize="xs" color="whiteAlpha.400">{t('locationLabel')}</Text><Text fontSize="sm" mt={1}>{activeEmergency.location}</Text></Box>
              </SimpleGrid>

              {activeEmergency.aiTriage && (
                <MotionBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} mt={6}>
                  <Box bg="rgba(0,188,212,0.1)" border="1px solid rgba(0,188,212,0.3)" borderRadius="16px" p={4}>
                    <HStack mb={2} justify="space-between">
                      <HStack>
                        <Icon as={FiActivity} color="cyan.400" />
                        <Text fontSize="xs" fontWeight="800" color="cyan.300" textTransform="uppercase">{t('aiSmartTriage')}</Text>
                      </HStack>
                      <Badge colorScheme={activeEmergency.aiTriage.priorityLevel === 'critical' ? 'red' : 'cyan'}>
                        {activeEmergency.aiTriage.priorityLevel}
                      </Badge>
                    </HStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="10px" color="whiteAlpha.500">{t('categoryLabel')}</Text>
                        <Text fontSize="sm" fontWeight="700" color="white">{activeEmergency.aiTriage.category?.toUpperCase()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="10px" color="whiteAlpha.500">{t('recommendedDept')}</Text>
                        <Text fontSize="sm" fontWeight="700" color="white">{activeEmergency.aiTriage.recommendedDepartment}</Text>
                      </Box>
                    </SimpleGrid>
                    <Text mt={3} fontSize="xs" color="whiteAlpha.700" fontStyle="italic">"{activeEmergency.aiTriage.analysisSummary}"</Text>
                    {/* Allocated Hospital Info */}
                    {(activeEmergency.assignedHospital || true) && (() => {
                      const hospName = activeEmergency.assignedHospital?.name || 'City General (Test)';
                      return (
                        <Box mt={3} pt={3} borderTop="1px solid rgba(255,255,255,0.1)">
                          <HStack>
                            <Icon as={MdLocalHospital} color="green.400" />
                            <Text fontSize="xs" fontWeight="700">{t('allocated')}: {hospName}</Text>
                          </HStack>
                        </Box>
                      );
                    })()}
                  </Box>
                </MotionBox>
              )}

              {/* Tracking Timeline */}
              <Box mt={8} mb={4} position="relative" px={4}>
                <Box position="absolute" top="10px" left="10%" right="10%" h="2px" bg="whiteAlpha.200" zIndex={0} />
                <Box position="absolute" top="10px" left="10%" w={activeEmergency.status === 'in_progress' ? '80%' : activeEmergency.status === 'assigned' ? '40%' : '0%'} h="2px" bg="green.400" zIndex={0} transition="width 1s ease" />
                
                <Flex justify="space-between" position="relative" zIndex={1}>
                  <VStack spacing={2}><Box w={6} h={6} borderRadius="full" bg="green.400" display="flex" alignItems="center" justifyContent="center" border="4px solid #1a202c"><Box w={2} h={2} bg="white" borderRadius="full" /></Box><Text fontSize="xs" color="white" fontWeight="600">{t('requested')}</Text></VStack>
                  <VStack spacing={2}><Box w={6} h={6} borderRadius="full" bg={['assigned', 'in_progress'].includes(activeEmergency.status) ? 'green.400' : 'gray.600'} display="flex" alignItems="center" justifyContent="center" border="4px solid #1a202c">{['assigned', 'in_progress'].includes(activeEmergency.status) && <Box w={2} h={2} bg="white" borderRadius="full" />}</Box><Text fontSize="xs" color={['assigned', 'in_progress'].includes(activeEmergency.status) ? 'white' : 'whiteAlpha.400'} fontWeight="600">{t('assigned')}</Text></VStack>
                  <VStack spacing={2}><Box w={6} h={6} borderRadius="full" bg={activeEmergency.status === 'in_progress' ? 'blue.400' : 'gray.600'} display="flex" alignItems="center" justifyContent="center" border="4px solid #1a202c">{activeEmergency.status === 'in_progress' && <Box w={2} h={2} bg="white" borderRadius="full" />}</Box><Text fontSize="xs" color={activeEmergency.status === 'in_progress' ? 'white' : 'whiteAlpha.400'} fontWeight="600">{t('enRoute')}</Text></VStack>
                  <VStack spacing={2}><Box w={6} h={6} borderRadius="full" bg={['arrived', 'dropped_off', 'resolved'].includes(activeEmergency.status) ? 'green.400' : 'gray.600'} display="flex" alignItems="center" justifyContent="center" border="4px solid #1a202c">{['arrived', 'dropped_off', 'resolved'].includes(activeEmergency.status) && <Box w={2} h={2} bg="white" borderRadius="full" />}</Box><Text fontSize="xs" color={['arrived', 'dropped_off', 'resolved'].includes(activeEmergency.status) ? 'white' : 'whiteAlpha.400'} fontWeight="600">Arrived</Text></VStack>
                </Flex>
              </Box>

              {/* Live Tracking Map */}
              {['assigned', 'in_progress', 'arrived'].includes(activeEmergency.status) && activeEmergency.coordinates?.lat && (
                <Box mt={6} mb={4} h="350px" borderRadius="16px" overflow="hidden" border="2px solid rgba(0,128,230,0.3)" boxShadow="0 0 20px rgba(0,128,230,0.15)" position="relative">
                  {!driverLocation && activeEmergency.status !== 'arrived' && (
                    <Box position="absolute" top="0" left="0" right="0" bg="rgba(0,0,0,0.7)" zIndex={1000} p={2} textAlign="center">
                      <Spinner size="sm" color="brand.400" mr={3} />
                      <Text as="span" color="white" fontSize="sm" fontWeight="600">
                        {t('waitingForAmbulanceGPS') === 'waitingForAmbulanceGPS' ? 'Connecting to Ambulance GPS...' : t('waitingForAmbulanceGPS')}
                      </Text>
                    </Box>
                  )}
                  {(driverToPatientDuration || patientToHospitalDuration) && ['in_progress', 'arrived'].includes(activeEmergency.status) && (
                    <Box position="absolute" top="10px" right="10px" bg="rgba(0,0,0,0.8)" zIndex={1000} p={3} borderRadius="12px" border="1px solid rgba(0,188,212,0.4)" backdropFilter="blur(10px)">
                      <Text fontSize="xs" color="whiteAlpha.700" fontWeight="700" textTransform="uppercase">
                        {activeEmergency.status === 'in_progress' ? 'Ambulance arriving in' : 'Hospital arrival in'}
                      </Text>
                      <HStack mt={1}>
                        <FiClock color="#00bcd4" />
                        <Text color="white" fontWeight="800" fontSize="lg">
                          {activeEmergency.status === 'in_progress' 
                            ? Math.ceil(driverToPatientDuration / 60) 
                            : Math.ceil(patientToHospitalDuration / 60)} mins
                        </Text>
                      </HStack>
                    </Box>
                  )}
                  <MapContainer 
                    center={[activeEmergency.coordinates.lat, activeEmergency.coordinates.lng]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    
                    <MapUpdater 
                      bounds={(() => {
                        const pts = [[activeEmergency.coordinates.lat, activeEmergency.coordinates.lng]];
                        if (driverLocation) pts.push(driverLocation);
                        const hLat = activeEmergency.assignedHospital?.location?.coordinates?.lat || (activeEmergency.coordinates.lat + 0.02);
                        const hLng = activeEmergency.assignedHospital?.location?.coordinates?.lng || (activeEmergency.coordinates.lng + 0.02);
                        pts.push([hLat, hLng]);
                        return pts;
                      })()}
                      center={!driverLocation ? [activeEmergency.coordinates.lat, activeEmergency.coordinates.lng] : null}
                    />
                    
                    {/* Ambulance Marker */}
                    {driverLocation && (
                      <Marker position={driverLocation} icon={ambulanceIcon}>
                        <Popup>🚑 {t('ambulanceEnRoute')}</Popup>
                      </Marker>
                    )}

                    {/* Patient Marker */}
                    <Marker position={[activeEmergency.coordinates.lat, activeEmergency.coordinates.lng]} icon={patientIcon}>
                      <Popup>📍 {t('yourLocation') || 'Your Location'}</Popup>
                    </Marker>

                    {/* Hospital Marker */}
                    {(() => {
                      const hLat = activeEmergency.assignedHospital?.location?.coordinates?.lat || (activeEmergency.coordinates.lat + 0.02);
                      const hLng = activeEmergency.assignedHospital?.location?.coordinates?.lng || (activeEmergency.coordinates.lng + 0.02);
                      const hName = activeEmergency.assignedHospital?.name || 'City General (Test)';
                      return (
                        <Marker position={[hLat, hLng]} icon={hospitalIcon}>
                          <Popup>🏥 {hName}</Popup>
                        </Marker>
                      );
                    })()}

                    {/* Route Line: Ambulance -> Patient */}
                    {driverLocation && driverToPatientRoute ? (
                      <Polyline 
                        positions={driverToPatientRoute} 
                        color="#0080e6" 
                        weight={6} 
                      />
                    ) : driverLocation && (
                      <Polyline 
                        positions={[driverLocation, [activeEmergency.coordinates.lat, activeEmergency.coordinates.lng]]} 
                        color="#0080e6" 
                        weight={5} 
                        dashArray="10, 10" 
                      />
                    )}

                    {/* Route Line: Patient -> Hospital */}
                    {patientToHospitalRoute ? (
                      <Polyline 
                        positions={patientToHospitalRoute} 
                        color="#38a169" 
                        weight={6} 
                      />
                    ) : (() => {
                      const hLat = activeEmergency.assignedHospital?.location?.coordinates?.lat || (activeEmergency.coordinates.lat + 0.02);
                      const hLng = activeEmergency.assignedHospital?.location?.coordinates?.lng || (activeEmergency.coordinates.lng + 0.02);
                      return (
                        <Polyline 
                          positions={[
                            [activeEmergency.coordinates.lat, activeEmergency.coordinates.lng], 
                            [hLat, hLng]
                          ]} 
                          color="#38a169" 
                          weight={5} 
                          dashArray="10, 10" 
                        />
                      );
                    })()}
                  </MapContainer>
                </Box>
              )}

              <FirstAidGuide activeEmergency={activeEmergency} />

              <Button mt={6} size="sm" w="100%" bg="rgba(229,62,62,0.2)" color="emergency.300" borderRadius="10px" onClick={() => { localStorage.setItem('activeEmergencyId', activeEmergency._id); navigate('/chat'); }} _hover={{ bg: 'rgba(229,62,62,0.3)' }}>{t('openEmergencyChat')}</Button>
            </Box>
          </MotionBox>
        )}

        {/* Medical Documents Section */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} mb={8}>
          <HStack mb={4} justify="space-between">
            <HStack>
              <FiUploadCloud color="rgba(255,255,255,0.4)" />
              <Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('medicalDocuments')}</Text>
            </HStack>
            <Button size="xs" variant="ghost" colorScheme="blue">{t('manageAll')}</Button>
          </HStack>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {[
              { type: t('prescriptions'), count: 4, icon: FiActivity },
              { type: t('labReports'), count: 2, icon: FiActivity },
              { type: t('scansXrays'), count: 1, icon: FiActivity },
            ].map((doc, i) => (
              <Box key={i} bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={4} position="relative" overflow="hidden">
                <Box position="absolute" top="-10px" right="-10px" opacity="0.05"><Icon as={doc.icon} boxSize={16} /></Box>
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="700" fontSize="sm">{doc.type}</Text>
                  <Text fontSize="xs" color="whiteAlpha.400">{doc.count} {t('filesUploaded')}</Text>
                  <Button mt={2} size="xs" variant="link" color="blue.400">{t('viewFiles')}</Button>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </MotionBox>

        <Box mb={8}>
          <MedicalQrCode />
        </Box>

        <Box mb={8}>
          <WearableHealthMonitor />
        </Box>

        <Box mb={8}>
          <FamilyContactManager />
        </Box>

        {/* Previous Emergencies */}
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <HStack mb={4}><FiClock color="rgba(255,255,255,0.4)" /><Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">{t('emergencyHistory')}</Text></HStack>
          {loading ? <Flex justify="center" py={10}><Spinner color="brand.400" /></Flex> : emergencies.length === 0 ? (
            <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={8} textAlign="center" border="1px solid rgba(255,255,255,0.04)">
              <Text color="whiteAlpha.400">{t('noEmergencyHistory')}</Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {emergencies.map((em, i) => (
                <Box key={em._id} bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={5} _hover={{ border: '1px solid rgba(255,255,255,0.12)' }} transition="all 0.3s">
                  <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <HStack spacing={4}>
                      <Box w="40px" h="40px" borderRadius="12px" bg={`${getSeverityColor(em.severity) === 'red' ? '#e53e3e' : getSeverityColor(em.severity) === 'orange' ? '#d69e2e' : '#38a169'}15`} display="flex" alignItems="center" justifyContent="center">
                        <FiAlertTriangle color={getSeverityColor(em.severity) === 'red' ? '#e53e3e' : getSeverityColor(em.severity) === 'orange' ? '#d69e2e' : '#38a169'} />
                      </Box>
                      <Box>
                        <Text fontWeight="600" fontSize="sm">{em.symptoms?.substring(0, 50) || 'Emergency'}</Text>
                        <HStack spacing={3} mt={1}><Text fontSize="xs" color="whiteAlpha.400"><FiMapPin style={{ display: 'inline', marginRight: 4 }} />{em.location}</Text><Text fontSize="xs" color="whiteAlpha.300">{new Date(em.createdAt).toLocaleDateString()}</Text></HStack>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme={getSeverityColor(em.severity)} fontSize="10px" borderRadius="6px">{em.severity}</Badge>
                      <Badge colorScheme={getStatusColor(em.status)} fontSize="10px" borderRadius="6px">{em.status.replace('_', ' ')}</Badge>
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}
        </MotionBox>
      </Container>

      {/* Emergency Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px" mx={4}>
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)" pb={4}>
            <HStack><Box bg="rgba(229,62,62,0.15)" p={2} borderRadius="10px"><MdEmergency color="#e53e3e" size={20} /></Box><Box><Text fontWeight="800">{t('reportEmergency')}</Text><Text fontSize="xs" color="whiteAlpha.400" fontWeight="400">{t('fillDetails')}</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('patientName')}</FormLabel><Input name="patientName" value={form.patientName} onChange={handleChange} size="sm" /></FormControl>
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('age')}</FormLabel><Input name="age" type="number" value={form.age} onChange={handleChange} size="sm" /></FormControl>
                </SimpleGrid>
                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('gender')}</FormLabel><Select name="gender" value={form.gender} onChange={handleChange} size="sm"><option value="male" style={{ background: '#0f1428' }}>{t('male')}</option><option value="female" style={{ background: '#0f1428' }}>{t('female')}</option><option value="other" style={{ background: '#0f1428' }}>{t('otherGender')}</option></Select></FormControl>
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('bloodGroup')}</FormLabel><Select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} size="sm">{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b} value={b} style={{ background: '#0f1428' }}>{b}</option>)}</Select></FormControl>
                </SimpleGrid>
                
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color="whiteAlpha.500">{t('location')}</FormLabel>
                  <HStack>
                    <Input name="location" value={form.location} onChange={handleChange} placeholder={t('yourAddress')} size="sm" />
                    <Button size="sm" leftIcon={<FiMapPin />} onClick={handleDetectLocation} colorScheme="blue" variant="ghost" fontSize="xs" px={4}>{t('locateMe')}</Button>
                  </HStack>
                </FormControl>

                <SimpleGrid columns={2} spacing={4} w="100%">
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('severityLevel')}</FormLabel><Select name="severity" value={form.severity} onChange={handleChange} size="sm"><option value="low" style={{ background: '#0f1428' }}>🟢 {t('lowSeverity')}</option><option value="medium" style={{ background: '#0f1428' }}>🟡 {t('mediumSeverity')}</option><option value="critical" style={{ background: '#0f1428' }}>🔴 {t('criticalSeverity')}</option></Select></FormControl>
                  <FormControl isRequired><FormLabel fontSize="xs" color="whiteAlpha.500">{t('transportType')}</FormLabel><Select name="transportType" value={form.transportType} onChange={handleChange} size="sm"><option value="ambulance" style={{ background: '#0f1428' }}>🚑 {t('ambulanceMedical')}</option><option value="cab" style={{ background: '#0f1428' }}>🚖 {t('taxiTransport')}</option></Select></FormControl>
                </SimpleGrid>
                <FormControl isRequired>
                  <HStack justify="space-between">
                    <FormLabel fontSize="xs" color="whiteAlpha.500" mb={0}>{t('symptoms')}</FormLabel>
                    <VoiceEmergencyAssistant onTranscriptionComplete={(text) => setForm({ ...form, symptoms: form.symptoms ? form.symptoms + ' ' + text : text })} />
                  </HStack>
                  <TransliterateInput 
                    as="textarea" 
                    name="symptoms" 
                    value={form.symptoms} 
                    onChangeText={(text) => setForm({ ...form, symptoms: text })} 
                    placeholder={t('describeSymptoms')} 
                    rows={3} 
                    size="sm" 
                    mt={2} 
                  />
                </FormControl>
                
                <Box w="100%" p={4} bg="rgba(255,255,255,0.03)" borderRadius="12px" border="1px solid rgba(255,255,255,0.06)">
                  <Text fontSize="xs" fontWeight="800" color="cyan.400" mb={3} textTransform="uppercase">{t('advancedAITriage')}</Text>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="10px" color="whiteAlpha.500">{t('breathingDifficulty')}</FormLabel>
                      <Input name="breathingDifficulty" type="number" min={1} max={10} value={form.triageInputs.breathingDifficulty} onChange={handleTriageChange} size="xs" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="10px" color="whiteAlpha.500">{t('painLevel')}</FormLabel>
                      <Input name="painLevel" type="number" min={1} max={10} value={form.triageInputs.painLevel} onChange={handleTriageChange} size="xs" />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="10px" color="whiteAlpha.500">{t('consciousnessLabel')}</FormLabel>
                      <Select name="consciousnessState" value={form.triageInputs.consciousnessState} onChange={handleTriageChange} size="xs">
                        <option value="conscious" style={{ background: '#0f1428' }}>{t('conscious')}</option>
                        <option value="confused" style={{ background: '#0f1428' }}>{t('confused')}</option>
                        <option value="unconscious" style={{ background: '#0f1428' }}>{t('unconscious')}</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <FormControl>
                  <FormLabel fontSize="xs" color="whiteAlpha.500">{t('additionalNotes')}</FormLabel>
                  <TransliterateInput 
                    as="textarea" 
                    name="additionalNotes" 
                    value={form.additionalNotes} 
                    onChangeText={(text) => setForm({ ...form, additionalNotes: text })} 
                    placeholder={t('anyAdditionalInfo')} 
                    rows={2} 
                    size="sm" 
                  />
                </FormControl>
                <Button type="submit" w="100%" size="lg" bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)" color="white" h="50px" borderRadius="14px" fontWeight="700" isLoading={formLoading} _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(229,62,62,0.4)' }} transition="all 0.3s">🚨 {t('submitEmergencyReport')}</Button>
              </VStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hospitals Modal */}
      <Modal isOpen={isHospitalsOpen} onClose={onHospitalsClose} size="lg" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px" mx={4}>
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)" pb={4}>
            <HStack><Box bg="rgba(0,188,212,0.15)" p={2} borderRadius="10px"><MdLocalHospital color="#00bcd4" size={20} /></Box><Box><Text fontWeight="800">{t('nearbyHospitals')}</Text><Text fontSize="xs" color="whiteAlpha.400" fontWeight="400">{t('availableFacilities')}</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              {[
                { name: 'City General Hospital', distance: '1.2 km', time: '5 mins', type: 'Public • 24/7 Trauma Center' },
                { name: 'Apollo Speciality Care', distance: '3.4 km', time: '12 mins', type: 'Private • Cardiology & Neuro' },
                { name: 'Grace Medical Center', distance: '5.0 km', time: '18 mins', type: 'Private • Multi-specialty' }
              ].map((h, i) => (
                <Box key={i} bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={4} _hover={{ bg: 'rgba(255,255,255,0.06)' }} transition="all 0.2s">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="700" color="white">{h.name}</Text>
                      <Text fontSize="xs" color="whiteAlpha.500" mt={1}>{h.type}</Text>
                      <HStack mt={2} spacing={3}>
                        <Badge colorScheme="teal" variant="subtle" fontSize="9px" px={2} borderRadius="full">{h.distance}</Badge>
                        <Badge colorScheme="blue" variant="subtle" fontSize="9px" px={2} borderRadius="full">Est: {h.time}</Badge>
                      </HStack>
                    </Box>
                    <VStack spacing={2}>
                      <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<FiMapPin />} borderRadius="10px" onClick={() => toast({ title: t('navigationStartedToast'), description: `${t('routingTo')} ${h.name}`, status: 'success', duration: 2000, position: 'top-right' })}>{t('directionsBtn')}</Button>
                    </VStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* First Aid Modal */}
      <Modal isOpen={isFirstAidOpen} onClose={onFirstAidClose} size="lg" isCentered scrollBehavior="inside">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px" mx={4}>
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)" pb={4}>
            <HStack><Box bg="rgba(229,62,62,0.15)" p={2} borderRadius="10px"><FiActivity color="#e53e3e" size={20} /></Box><Box><Text fontWeight="800">{t('firstAidGuides')}</Text><Text fontSize="xs" color="whiteAlpha.400" fontWeight="400">{t('immediateActions')}</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <Accordion allowToggle>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600" color="white">{t('heartAttackTitle')}</Box>
                  <AccordionIcon color="whiteAlpha.500" />
                </AccordionButton>
                <AccordionPanel pb={4} color="whiteAlpha.600" fontSize="sm" whiteSpace="pre-line">
                  {t('heartAttackSteps')}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600" color="white">{t('severeBleedingTitle')}</Box>
                  <AccordionIcon color="whiteAlpha.500" />
                </AccordionButton>
                <AccordionPanel pb={4} color="whiteAlpha.600" fontSize="sm" whiteSpace="pre-line">
                  {t('severeBleedingSteps')}
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem border="none" bg="rgba(255,255,255,0.03)" borderRadius="12px" mb={3}>
                <AccordionButton _hover={{ bg: 'rgba(255,255,255,0.06)' }} borderRadius="12px">
                  <Box flex="1" textAlign="left" fontWeight="600" color="white">{t('chokingTitle')}</Box>
                  <AccordionIcon color="whiteAlpha.500" />
                </AccordionButton>
                <AccordionPanel pb={4} color="whiteAlpha.600" fontSize="sm" whiteSpace="pre-line">
                  {t('chokingSteps')}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Medical Profile Modal */}
      <Modal isOpen={isProfileOpen} onClose={onProfileClose} size="md" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px" mx={4}>
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)" pb={4}>
            <HStack><Box bg="rgba(0,128,230,0.15)" p={2} borderRadius="10px"><FiUser color="#0080e6" size={20} /></Box><Box><Text fontWeight="800">{t('medicalId')}</Text><Text fontSize="xs" color="whiteAlpha.400" fontWeight="400">{t('preFillInfo')}</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <Box as="form" onSubmit={saveProfile}>
              <VStack spacing={4}>
                <FormControl><FormLabel fontSize="xs" color="whiteAlpha.500">{t('bloodGroup')}</FormLabel><Select value={profile.bloodGroup} onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})} size="sm">{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=><option key={b} value={b} style={{ background: '#0f1428' }}>{b}</option>)}</Select></FormControl>
                <FormControl><FormLabel fontSize="xs" color="whiteAlpha.500">{t('knownAllergies')}</FormLabel><Input value={profile.allergies} onChange={(e) => setProfile({...profile, allergies: e.target.value})} placeholder={t('allergyPlaceholder')} size="sm" /></FormControl>
                <FormControl><FormLabel fontSize="xs" color="whiteAlpha.500">{t('currentMedications')}</FormLabel><Textarea value={profile.medications} onChange={(e) => setProfile({...profile, medications: e.target.value})} placeholder={t('medicationPlaceholder')} rows={2} size="sm" /></FormControl>
                <FormControl><FormLabel fontSize="xs" color="whiteAlpha.500">{t('emergencyContactLabel')}</FormLabel><Input value={profile.emergencyContact} onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})} placeholder={t('contactPlaceholder')} size="sm" /></FormControl>
                <Button type="submit" w="100%" size="lg" colorScheme="blue" h="50px" borderRadius="14px" fontWeight="700">{t('saveMedicalId')}</Button>
              </VStack>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* Feature 7: SOS Floating Button */}
      <SOSButton />
    </Box>
  );
};

export default PatientDashboard;
