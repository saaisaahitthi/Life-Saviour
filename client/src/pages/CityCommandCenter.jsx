import { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Grid, GridItem, Heading, Text, SimpleGrid, 
  HStack, VStack, Icon, Flex, Badge, Button, Progress, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FiMap, FiActivity, FiNavigation, FiServer, 
  FiAlertCircle, FiArrowRight, FiTarget
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api, { hospitalService } from '../services/api';

const MotionBox = motion(Box);

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CityCommandCenter = () => {
  const [zones, setZones] = useState([
    { name: 'North District', activeEmergencies: 4, hospitals: 2, capacity: 85, color: '#e53e3e' },
    { name: 'Central Metropolitan', activeEmergencies: 12, hospitals: 5, capacity: 92, color: '#00bcd4' },
    { name: 'South Industrial', activeEmergencies: 3, hospitals: 1, capacity: 45, color: '#38a169' },
    { name: 'East Residential', activeEmergencies: 7, hospitals: 3, capacity: 68, color: '#0080e6' },
  ]);

  const [emergencies, setEmergencies] = useState([]);
  const [dbHospitals, setDbHospitals] = useState([]);
  const alertedHospitals = useRef(new Set());
  const toast = useToast();

  useEffect(() => {
    dbHospitals.forEach(h => {
      if (h.load > 90 && !alertedHospitals.current.has(h.name)) {
        toast({
          title: "CRITICAL: HOSPITAL OVERLOADED",
          description: `${h.name} has reached maximum capacity (${h.load}%). The AI is rerouting all new emergencies.`,
          status: "error",
          duration: 15000,
          isClosable: true,
          position: "top-right"
        });
        alertedHospitals.current.add(h.name);
      }
    });
  }, [dbHospitals]);

  useEffect(() => {
    fetchHeatmapData();
    fetchHospitals();
    // Poll for live updates every 30 seconds
    const interval = setInterval(() => {
      fetchHeatmapData();
      fetchHospitals();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data } = await hospitalService.getAll();
      setDbHospitals(data.map(h => {
        const total = h.capacity.emergencyBeds.total || 1;
        const available = h.capacity.emergencyBeds.available || 0;
        const loadPercentage = Math.floor(((total - available) / total) * 100);
        
        return {
          name: h.name,
          load: loadPercentage,
          status: h.status === 'active' ? 'OPERATIONAL' : 'OVERLOADED',
          action: h.status === 'active' ? 'RECEIVING' : 'REROUTE ACTIVE',
          lat: h.location?.coordinates?.lat || 12.9716,
          lng: h.location?.coordinates?.lng || 77.5946
        };
      }));
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    }
  };

  const fetchHeatmapData = async () => {
    try {
      const { data } = await api.get('/geo/heatmap');
      setEmergencies(data);
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
    }
  };


  return (
    <Box minH="100vh" bg="#050810" pt="80px" color="white">
      <style>
        {`
          @keyframes pulseSiren {
            0% { box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); border-color: rgba(229, 62, 62, 0.8); }
            70% { box-shadow: 0 0 0 15px rgba(229, 62, 62, 0); border-color: rgba(229, 62, 62, 0.1); }
            100% { box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); border-color: rgba(229, 62, 62, 0.8); }
          }
        `}
      </style>
      <Container maxW="1800px">
        {/* Top Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <HStack mb={1}>
              <Icon as={FiTarget} color="brand.400" />
              <Text fontSize="xs" fontWeight="800" color="whiteAlpha.400" textTransform="uppercase" letterSpacing="2px">City-Wide Tactical Overview</Text>
            </HStack>
            <Heading size="lg">Regional Command Center</Heading>
          </Box>
          <HStack spacing={4}>
            <Badge colorScheme="green" variant="outline" p={2} borderRadius="10px">NETWORK STABLE</Badge>
            <Badge colorScheme="blue" p={2} borderRadius="10px">12 ACTIVE AMBULANCES</Badge>
          </HStack>
        </Flex>

        <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={6}>
          {zones.map((zone, i) => (
            <MotionBox key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="20px" p={5} backdropFilter="blur(10px)">
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="800" fontSize="sm">{zone.name}</Text>
                  <Icon as={FiMap} color={zone.color} />
                </HStack>
                <SimpleGrid columns={2} spacing={4} mb={4}>
                  <Box>
                    <Text fontSize="10px" color="whiteAlpha.400">EMERGENCIES</Text>
                    <Text fontSize="xl" fontWeight="900">{zone.activeEmergencies}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="10px" color="whiteAlpha.400">HOSPITALS</Text>
                    <Text fontSize="xl" fontWeight="900">{zone.hospitals}</Text>
                  </Box>
                </SimpleGrid>
                <Text fontSize="10px" color="whiteAlpha.400" mb={1}>NETWORK CAPACITY</Text>
                <Progress value={zone.capacity} size="xs" colorScheme={zone.capacity > 80 ? 'red' : 'blue'} bg="whiteAlpha.100" borderRadius="full" />
              </Box>
            </MotionBox>
          ))}
        </Grid>

        <Grid templateColumns="2fr 1fr" gap={6}>
          <GridItem>
            <Box h="600px" bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" overflow="hidden" position="relative">
              <Box position="absolute" top={4} left={4} zIndex={1000} bg="rgba(5,8,16,0.8)" p={3} borderRadius="12px" border="1px solid rgba(255,255,255,0.1)">
                <VStack align="flex-start" spacing={2}>
                  <HStack><Box w={3} h={3} borderRadius="full" bg="red.500" /><Text fontSize="xs">Critical Emergency</Text></HStack>
                  <HStack><Box w={3} h={3} borderRadius="full" bg="orange.500" /><Text fontSize="xs">Ongoing Triage</Text></HStack>
                  <HStack><Box w={3} h={3} borderRadius="full" bg="blue.500" /><Text fontSize="xs">Ambulance En Route</Text></HStack>
                </VStack>
              </Box>
              
              <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                
                {/* Render Hospitals */}
                {dbHospitals.map((h, i) => (
                  <Marker key={`h-${i}`} position={[h.lat, h.lng]}>
                    <Popup>
                      <strong>{h.name}</strong><br/>
                      Status: {h.status}<br/>
                      Load: {h.load}%
                    </Popup>
                  </Marker>
                ))}

                {/* Render Emergencies */}
                {emergencies.map(em => (
                  <Circle 
                    key={em.id}
                    center={[em.lat, em.lng]}
                    radius={500}
                    pathOptions={{ color: em.severity === 'critical' ? 'red' : 'orange', fillColor: em.severity === 'critical' ? 'red' : 'orange' }}
                  >
                    <Popup>{em.type} Emergency - {em.severity}</Popup>
                  </Circle>
                ))}
              </MapContainer>
            </Box>
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={6} flex="1">
                <Heading size="sm" mb={6}>Hospital Coordination</Heading>
                <VStack spacing={4} align="stretch">
                  {dbHospitals.length > 0 ? dbHospitals.map((h, i) => (
                    <Box 
                      key={i} 
                      p={4} 
                      bg={h.load > 90 ? "rgba(229, 62, 62, 0.1)" : "rgba(255,255,255,0.03)"} 
                      border="1px solid" 
                      borderColor={h.load > 90 ? "red.500" : "rgba(255,255,255,0.06)"}
                      borderRadius="16px"
                      animation={h.load > 90 ? `pulseSiren 1.5s infinite` : "none"}
                      transition="all 0.3s"
                    >
                      <Flex justify="space-between" mb={2}>
                        <Text fontWeight="700" fontSize="sm">{h.name}</Text>
                        <Badge colorScheme={h.load > 90 || h.status === 'OVERLOADED' ? 'red' : 'green'} fontSize="9px">{h.load > 90 ? 'OVERLOADED' : h.status}</Badge>
                      </Flex>
                      <Progress value={h.load} size="xs" colorScheme={h.load > 90 || h.status === 'OVERLOADED' ? 'red' : 'blue'} mb={3} />
                      <Button size="xs" w="100%" variant="outline" colorScheme={h.load > 90 || h.status === 'OVERLOADED' ? 'orange' : 'blue'} rightIcon={<FiArrowRight />}>{h.load > 90 ? 'REROUTE ACTIVE' : h.action}</Button>
                    </Box>
                  )) : (
                    <Text fontSize="sm" color="whiteAlpha.400">No hospitals registered yet. Add one in the Admin Panel.</Text>
                  )}
                </VStack>
              </Box>

              <Box bg="linear-gradient(135deg, rgba(229,62,62,0.1) 0%, rgba(0,188,212,0.05) 100%)" border="1px solid rgba(229,62,62,0.2)" borderRadius="24px" p={6}>
                <HStack mb={4}><Icon as={FiAlertCircle} color="red.400" /><Text fontWeight="800" fontSize="sm">System Alerts</Text></HStack>
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="xs" color="whiteAlpha.600">⚠️ Central Zone exceeds 90% capacity. Automated rerouting enabled for new low-priority cases.</Text>
                  <Text fontSize="xs" color="whiteAlpha.600">ℹ️ Ambulance Unit #043 maintenance scheduled in 2 hours.</Text>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default CityCommandCenter;
