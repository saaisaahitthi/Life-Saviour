import { useState, useEffect } from 'react';
import {
  Box, Container, Grid, GridItem, Heading, Text, VStack, HStack,
  Input, Button, FormControl, FormLabel, Select, Table, Thead, Tbody,
  Tr, Th, Td, Badge, Icon, useToast, Flex
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiPlus, FiMapPin, FiServer, FiActivity } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hospitalService } from '../services/api';

const MotionBox = motion(Box);

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition, setForm }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setForm(prev => ({ ...prev, lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }));
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const AdminDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const toast = useToast();
  
  const [form, setForm] = useState({
    name: '',
    zone: 'Central',
    lat: '',
    lng: '',
    totalEmergencyBeds: '',
    totalICUBeds: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const { data } = await hospitalService.getAll();
      setHospitals(data);
    } catch (err) {
      toast({ title: 'Failed to load hospitals', status: 'error' });
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await hospitalService.create(form);
      toast({ title: 'Hospital Registered Successfully', status: 'success' });
      setForm({ name: '', zone: 'Central', lat: '', lng: '', totalEmergencyBeds: '', totalICUBeds: '' });
      setMapPosition(null);
      fetchHospitals(); // Refresh list
    } catch (err) {
      toast({ title: 'Failed to register', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="#050810" pt="100px" pb="50px" color="white">
      <Container maxW="1600px">
        <Flex justify="space-between" align="center" mb={10}>
          <Box>
            <HStack mb={2}>
              <Icon as={FiServer} color="red.400" />
              <Text fontSize="xs" fontWeight="800" color="red.400" textTransform="uppercase" letterSpacing="2px">Super Admin Portal</Text>
            </HStack>
            <Heading size="xl">Infrastructure Management</Heading>
          </Box>
        </Flex>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={8}>
          
          {/* Registration Form */}
          <GridItem>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
                <HStack mb={6}>
                  <Box p={2} bg="rgba(0,188,212,0.1)" borderRadius="10px"><Icon as={FiPlus} color="#00bcd4" /></Box>
                  <Heading size="md">Register New Hospital</Heading>
                </HStack>

                <Box as="form" onSubmit={handleSubmit}>
                  <VStack spacing={5}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="whiteAlpha.600">Hospital Name</FormLabel>
                      <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. MegaCare Central" />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="sm" color="whiteAlpha.600">City Zone</FormLabel>
                      <Select name="zone" value={form.zone} onChange={handleChange}>
                        <option value="North" style={{background: '#0f1428'}}>North District</option>
                        <option value="South" style={{background: '#0f1428'}}>South Industrial</option>
                        <option value="East" style={{background: '#0f1428'}}>East Residential</option>
                        <option value="West" style={{background: '#0f1428'}}>West District</option>
                        <option value="Central" style={{background: '#0f1428'}}>Central Metropolitan</option>
                      </Select>
                    </FormControl>

                    <Box h="200px" w="100%" borderRadius="12px" overflow="hidden" border="1px solid rgba(255,255,255,0.1)">
                      <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                        <LocationPicker position={mapPosition} setPosition={setMapPosition} setForm={setForm} />
                      </MapContainer>
                    </Box>
                    <Text fontSize="xs" color="whiteAlpha.500" mt="-3">Click on the map to auto-fill latitude & longitude</Text>

                    <Grid templateColumns="1fr 1fr" gap={4} w="100%">
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="whiteAlpha.600">Latitude</FormLabel>
                        <Input name="lat" type="number" step="any" value={form.lat} onChange={handleChange} placeholder="12.9716" />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="whiteAlpha.600">Longitude</FormLabel>
                        <Input name="lng" type="number" step="any" value={form.lng} onChange={handleChange} placeholder="77.5946" />
                      </FormControl>
                    </Grid>

                    <Grid templateColumns="1fr 1fr" gap={4} w="100%">
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="whiteAlpha.600">Emergency Beds</FormLabel>
                        <Input name="totalEmergencyBeds" type="number" value={form.totalEmergencyBeds} onChange={handleChange} placeholder="50" />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="whiteAlpha.600">ICU Beds</FormLabel>
                        <Input name="totalICUBeds" type="number" value={form.totalICUBeds} onChange={handleChange} placeholder="20" />
                      </FormControl>
                    </Grid>

                    <Button type="submit" w="100%" size="lg" bg="#0080e6" color="white" mt={4} isLoading={loading} _hover={{ bg: '#00bcd4' }}>
                      Register Facility into Network
                    </Button>
                  </VStack>
                </Box>
              </Box>
            </MotionBox>
          </GridItem>

          {/* Registered Hospitals List */}
          <GridItem>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
                <HStack mb={6} justify="space-between">
                  <HStack>
                    <Box p={2} bg="rgba(56,161,105,0.1)" borderRadius="10px"><Icon as={FiActivity} color="#38a169" /></Box>
                    <Heading size="md">Active Network Infrastructure</Heading>
                  </HStack>
                  <Badge colorScheme="green">{hospitals.length} FACILITIES ONLINE</Badge>
                </HStack>

                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="whiteAlpha.500" borderBottom="1px solid rgba(255,255,255,0.1)">Hospital Name</Th>
                        <Th color="whiteAlpha.500" borderBottom="1px solid rgba(255,255,255,0.1)">Zone</Th>
                        <Th color="whiteAlpha.500" borderBottom="1px solid rgba(255,255,255,0.1)">Emergency Beds</Th>
                        <Th color="whiteAlpha.500" borderBottom="1px solid rgba(255,255,255,0.1)">ICU Beds</Th>
                        <Th color="whiteAlpha.500" borderBottom="1px solid rgba(255,255,255,0.1)">Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {hospitals.map(h => (
                        <Tr key={h._id}>
                          <Td borderBottom="1px solid rgba(255,255,255,0.05)" py={4} fontWeight="600">{h.name}</Td>
                          <Td borderBottom="1px solid rgba(255,255,255,0.05)" py={4}><HStack><Icon as={FiMapPin} color="whiteAlpha.400" /><Text>{h.zone}</Text></HStack></Td>
                          <Td borderBottom="1px solid rgba(255,255,255,0.05)" py={4}>{h.capacity.emergencyBeds.total}</Td>
                          <Td borderBottom="1px solid rgba(255,255,255,0.05)" py={4}>{h.capacity.icuBeds.total}</Td>
                          <Td borderBottom="1px solid rgba(255,255,255,0.05)" py={4}>
                            <Badge colorScheme={h.status === 'active' ? 'green' : 'red'}>{h.status}</Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  {hospitals.length === 0 && (
                    <Box textAlign="center" py={10} color="whiteAlpha.400">
                      No hospitals registered yet. Add one to populate the Command Center.
                    </Box>
                  )}
                </Box>
              </Box>
            </MotionBox>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
