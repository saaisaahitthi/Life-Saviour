import { useState, useEffect, useRef } from 'react';
import {
  Box, VStack, HStack, Text, SimpleGrid, Icon, Badge, Button,
  Flex, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, useToast, Spinner, Progress, Switch, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormControl, FormLabel
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiActivity, FiWind, FiThermometer, FiWatch, FiBluetooth, FiRefreshCw, FiPlus, FiX, FiCheck, FiZap } from 'react-icons/fi';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);

const SIMULATED_DEVICES = [
  { id: 'fitbit-charge-5', name: 'Fitbit Charge 5', type: 'Fitness Tracker', icon: '⌚', battery: 82 },
  { id: 'apple-watch-se', name: 'Apple Watch SE', type: 'Smartwatch', icon: '⌚', battery: 65 },
  { id: 'mi-band-7', name: 'Mi Smart Band 7', type: 'Fitness Band', icon: '⌚', battery: 91 },
  { id: 'samsung-galaxy-fit', name: 'Samsung Galaxy Fit3', type: 'Fitness Tracker', icon: '⌚', battery: 74 },
];

const VitalCard = ({ icon, label, value, unit, color, trend, alert }) => (
  <Box
    bg={alert ? `rgba(229,62,62,0.1)` : 'rgba(15,20,40,0.6)'}
    border={`1px solid ${alert ? 'rgba(229,62,62,0.3)' : 'rgba(255,255,255,0.06)'}`}
    borderRadius="18px"
    p={4}
    position="relative"
    overflow="hidden"
    transition="all 0.3s"
    _hover={{ border: `1px solid ${color}40` }}
  >
    {alert && <Box position="absolute" top={0} left={0} right={0} h="2px" bg="red.500" className="pulse-animation" />}
    <HStack justify="space-between" mb={3}>
      <Box p={2} bg={`${color}15`} borderRadius="10px">
        <Icon as={icon} color={color} boxSize={4} />
      </Box>
      {alert && <Badge colorScheme="red" fontSize="8px" variant="solid">⚠</Badge>}
    </HStack>
    <Text fontSize="2xl" fontWeight="900" color="white">{value}</Text>
    <Text fontSize="10px" color="whiteAlpha.500" fontWeight="600">{unit}</Text>
    <Text fontSize="xs" color="whiteAlpha.400" mt={1}>{label}</Text>
    {trend && trend.length > 0 && (
      <Box h="30px" mt={2}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    )}
  </Box>
);

const WearableHealthMonitor = ({ userId }) => {
  const [vitals, setVitals] = useState(null);
  const [vitalHistory, setVitalHistory] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(() => {
    const saved = localStorage.getItem('connectedWearable');
    return saved ? JSON.parse(saved) : null;
  });
  const [connectingDeviceId, setConnectingDeviceId] = useState(null);
  const [searching, setSearching] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);

  // False Alarm Prevention
  const [criticalAlert, setCriticalAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(15);
  const alertTimerRef = useRef(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { t } = useLanguage();

  // Simulate vitals when device is connected
  useEffect(() => {
    if (!connectedDevice) {
      setVitals(null);
      setVitalHistory([]);
      return;
    }

    // ONLY run the simulator if it's NOT a real device!
    // Real devices update state directly via characteristicvaluechanged event listener
    if (connectedDevice.isReal) return;

    const generateVitals = () => {
      const data = {
        heartRate: Math.floor(60 + Math.random() * 40),
        spO2: Math.floor(94 + Math.random() * 6),
        bodyTemperature: (36.1 + Math.random() * 1.5).toFixed(1),
        bloodPressure: {
          systolic: Math.floor(110 + Math.random() * 30),
          diastolic: Math.floor(65 + Math.random() * 20),
        }
      };
      setVitals(data);
      localStorage.setItem('latestWearableVitals', JSON.stringify(data));
      
      setVitalHistory(prev => [...prev.slice(-20), {
        hr: data.heartRate,
        sp: data.spO2,
        t: Date.now()
      }]);

      // If there's an active emergency, emit live vitals to doctor
      const activeEmergencyId = localStorage.getItem('activeEmergencyId');
      if (activeEmergencyId) {
        const s = getSocket();
        if (s) s.emit('wearable_update', { 
          emergencyId: activeEmergencyId, 
          vitals: {
            deviceName: connectedDevice?.name || 'Wearable',
            heartRate: data.heartRate,
            bloodOxygen: data.spO2,
            temperature: parseFloat(data.bodyTemperature),
            bloodPressure: `${data.bloodPressure.systolic}/${data.bloodPressure.diastolic}`
          } 
        });
      }
    };

    generateVitals();
    const interval = setInterval(generateVitals, 3000);
    return () => clearInterval(interval);
  }, [connectedDevice]);

  // Critical Vitals SOS Auto-Trigger
  useEffect(() => {
    if (vitals && !criticalAlert) {
      const isSevereBradycardia = vitals.heartRate <= 40;
      const isSevereTachycardia = vitals.heartRate >= 180;
      const isCompoundFailure = vitals.heartRate >= 120 && vitals.spO2 <= 90;
      const isSevereHypoxia = vitals.spO2 <= 85;

      if (isSevereBradycardia || isSevereTachycardia || isCompoundFailure || isSevereHypoxia) {
        setCriticalAlert(true);
        setAlertCountdown(15);
        
        alertTimerRef.current = setInterval(() => {
          setAlertCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(alertTimerRef.current);
              setCriticalAlert(false);
              // Trigger SOS
              const sosBtn = document.getElementById('sos-trigger-btn');
              if (sosBtn) sosBtn.click();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [vitals, criticalAlert]);

  const cancelFalseAlarm = () => {
    clearInterval(alertTimerRef.current);
    setCriticalAlert(false);
    toast({
      title: 'False Alarm Cancelled',
      description: 'Your vitals have been logged but no SOS was sent.',
      status: 'info',
      duration: 3000,
      position: 'top'
    });
  };

  const handleOpenPairingModal = () => {
    setSearching(true);
    setFoundDevices([]);
    onOpen();

    // Show simulated devices as fallback
    setTimeout(() => {
      setFoundDevices(SIMULATED_DEVICES);
      setSearching(false);
    }, 1500);
  };

  const handleBluetoothSearch = async () => {
    try {
      if (!navigator.bluetooth) {
        toast({ title: 'Bluetooth Not Supported', description: 'Web Bluetooth requires HTTPS or localhost. Falling back to simulated devices.', status: 'warning' });
        return;
      }
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });
      
      const realDevice = {
        id: device.id || `bt-${Date.now()}`,
        name: device.name || 'Real Smartwatch',
        type: 'Real Wearable',
        icon: '🔗',
        battery: 100, 
        isReal: true,
        gattDevice: device
      };
      
      setFoundDevices(prev => [realDevice, ...prev.filter(d => !d.isReal)]);
      toast({ title: 'Real Device Found', status: 'success', duration: 2000 });
    } catch (err) {
      console.error('Bluetooth Error:', err);
      toast({ title: 'Bluetooth Search Failed', description: err.message, status: 'error' });
    }
  };

  const handleConnectDevice = async (device) => {
    setConnectingDeviceId(device.id);

    if (device.isReal && device.gattDevice) {
      try {
        const server = await device.gattDevice.gatt.connect();
        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');
        
        await characteristic.startNotifications();
        
        // Listen to the real hardware!
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          // Standard BLE Heart Rate format: First byte flags, second byte is HR if 8-bit
          const hr = value.getUint8(1);
          
          setVitals(prev => {
            const newVitals = prev ? { ...prev, heartRate: hr } : {
              heartRate: hr,
              spO2: 98, // Mock SpO2 since standard HR service doesn't provide it
              bodyTemperature: 36.5,
              bloodPressure: { systolic: 120, diastolic: 80 }
            };
            
            // Emit to socket
            const activeEmergencyId = localStorage.getItem('activeEmergencyId');
            if (activeEmergencyId) {
              getSocket().emit('wearable_update', { emergencyId: activeEmergencyId, vitals: newVitals });
            }
            
            setVitalHistory(history => [...history.slice(-20), { hr, sp: newVitals.spO2, t: Date.now() }]);
            return newVitals;
          });
        });

        const connected = { ...device, connectedAt: new Date().toISOString() };
        setConnectedDevice(connected);
        localStorage.setItem('connectedWearable', JSON.stringify(connected));
        toast({ title: t('deviceConnectedToast'), description: `Streaming live GATT data from ${device.name}`, status: 'success' });
      } catch (err) {
        console.error('GATT Connection Error:', err);
        toast({ title: 'GATT Connection Failed', description: err.message, status: 'error' });
      } finally {
        setConnectingDeviceId(null);
        onClose();
      }
    } else {
      // Simulator connection
      setTimeout(() => {
        const connected = { ...device, connectedAt: new Date().toISOString() };
        setConnectedDevice(connected);
        localStorage.setItem('connectedWearable', JSON.stringify(connected));
        setConnectingDeviceId(null);
        onClose();
        toast({ title: t('deviceConnectedToast'), description: `${device.name} ${t('paired').toLowerCase()}`, status: 'success' });
      }, 2500);
    }
  };

  const handleDisconnect = () => {
    const deviceName = connectedDevice?.name;
    setConnectedDevice(null);
    localStorage.removeItem('connectedWearable');
    setVitals(null);
    setVitalHistory([]);
    toast({
      title: t('deviceDisconnectedToast'),
      description: deviceName,
      status: 'info',
      duration: 2000,
      position: 'top-right',
    });
  };

  const hrTrend = vitalHistory.map(v => ({ v: v.hr }));
  const spTrend = vitalHistory.map(v => ({ v: v.sp }));

  const isHrAlert = vitals && (vitals.heartRate > 120 || vitals.heartRate < 50);
  const isSpO2Alert = vitals && vitals.spO2 < 93;

  const deviceCount = connectedDevice ? 1 : 0;

  return (
    <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <FiWatch color="rgba(255,255,255,0.4)" />
          <Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
            {t('healthMonitor')}
          </Text>
          {connectedDevice && <Badge colorScheme="green" fontSize="8px" variant="subtle">{t('live')}</Badge>}
        </HStack>
        <HStack spacing={2}>
          <Badge colorScheme={deviceCount > 0 ? 'green' : 'gray'} variant="outline" fontSize="8px">
            <HStack spacing={1}><FiBluetooth /><Text>{deviceCount} {deviceCount !== 1 ? t('devices') : t('device')}</Text></HStack>
          </Badge>
          {connectedDevice ? (
            <HStack spacing={2}>
              <Button size="xs" variant="ghost" colorScheme="blue" leftIcon={<FiRefreshCw />}>{t('sync')}</Button>
              <Button size="xs" variant="ghost" colorScheme="red" leftIcon={<FiX />} onClick={handleDisconnect}>{t('disconnect')}</Button>
            </HStack>
          ) : (
            <Button size="xs" bg="linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)" color="white" leftIcon={<FiPlus />} borderRadius="8px" onClick={handleOpenPairingModal} _hover={{ transform: 'translateY(-1px)', boxShadow: '0 4px 15px rgba(0,128,230,0.4)' }} transition="all 0.3s">
              {t('connectDevice')}
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Connected Device Info */}
      {connectedDevice && (
        <Box bg="rgba(0,128,230,0.08)" border="1px solid rgba(0,128,230,0.15)" borderRadius="14px" p={3} mb={4}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box w="36px" h="36px" borderRadius="10px" bg="rgba(0,128,230,0.15)" display="flex" alignItems="center" justifyContent="center" fontSize="lg">
                {connectedDevice.icon}
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="700" color="white">{connectedDevice.name}</Text>
                <Text fontSize="10px" color="whiteAlpha.400">{connectedDevice.type}</Text>
              </Box>
            </HStack>
            <HStack spacing={3}>
              <HStack spacing={1}>
                <FiZap color="#38a169" size={12} />
                <Text fontSize="10px" color="green.300" fontWeight="600">{connectedDevice.battery}%</Text>
              </HStack>
              <Badge colorScheme="green" fontSize="8px" variant="subtle">
                <HStack spacing={1}><Box w="5px" h="5px" borderRadius="full" bg="green.400" /><Text>{t('paired')}</Text></HStack>
              </Badge>
            </HStack>
          </HStack>
        </Box>
      )}

      {vitals ? (
        <Box>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            <VitalCard icon={FiHeart} label={t('heartRate')} value={vitals.heartRate} unit="BPM" color="#e53e3e" trend={hrTrend} alert={isHrAlert} />
            <VitalCard icon={FiWind} label={t('spO2')} value={vitals.spO2} unit="%" color="#00bcd4" trend={spTrend} alert={isSpO2Alert} />
            <VitalCard icon={FiThermometer} label={t('temperature')} value={vitals.bodyTemperature} unit="°C" color="#d69e2e" />
            <VitalCard icon={FiActivity} label={t('bloodPressure')} value={`${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`} unit="mmHg" color="#805ad5" />
          </SimpleGrid>
        </Box>
      ) : (
        <Box
          bg="rgba(15,20,40,0.4)"
          borderRadius="16px"
          p={8}
          textAlign="center"
          border="1px dashed rgba(255,255,255,0.08)"
          cursor="pointer"
          onClick={handleOpenPairingModal}
          _hover={{ border: '1px dashed rgba(0,128,230,0.3)', bg: 'rgba(15,20,40,0.6)' }}
          transition="all 0.3s"
        >
          <Icon as={FiWatch} boxSize={10} color="whiteAlpha.200" mb={3} />
          <Text fontSize="sm" color="whiteAlpha.400" fontWeight="600">{t('noDevicesConnected')}</Text>
          <Text fontSize="xs" color="whiteAlpha.300" mt={1}>{t('tapToConnect')}</Text>
          <Button mt={4} size="sm" bg="linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)" color="white" leftIcon={<FiBluetooth />} borderRadius="10px" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,128,230,0.4)' }} transition="all 0.3s">
            {t('connectDevice')}
          </Button>
        </Box>
      )}

      {/* Pairing Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px" mx={4}>
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)" pb={4}>
            <HStack>
              <Box bg="rgba(0,128,230,0.15)" p={2} borderRadius="10px"><FiBluetooth color="#0080e6" size={20} /></Box>
              <Box>
                <Text fontWeight="800">{t('connectWearable')}</Text>
                <Text fontSize="xs" color="whiteAlpha.400" fontWeight="400">{t('selectDeviceToPair')}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            {searching ? (
              <VStack py={8} spacing={4}>
                <Spinner size="lg" color="brand.400" thickness="3px" />
                <Text fontSize="sm" color="whiteAlpha.500">{t('searchingDevices')}</Text>
                <Progress size="xs" isIndeterminate colorScheme="blue" w="60%" borderRadius="full" />
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                <Button 
                  w="100%" 
                  colorScheme="blue" 
                  variant="outline" 
                  borderStyle="dashed" 
                  leftIcon={<FiBluetooth />} 
                  onClick={handleBluetoothSearch}
                >
                  Search for Bluetooth Devices
                </Button>
                <Text fontSize="10px" color="whiteAlpha.400" textAlign="center" mt={2} textTransform="uppercase">Or select a simulated device</Text>
                
                {foundDevices.map((device) => (
                  <Box
                    key={device.id}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.06)"
                    borderRadius="16px"
                    p={4}
                    cursor="pointer"
                    onClick={() => !connectingDeviceId && handleConnectDevice(device)}
                    _hover={{ bg: 'rgba(0,128,230,0.08)', border: '1px solid rgba(0,128,230,0.2)' }}
                    transition="all 0.3s"
                    opacity={connectingDeviceId && connectingDeviceId !== device.id ? 0.4 : 1}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Box w="44px" h="44px" borderRadius="12px" bg="rgba(0,128,230,0.12)" display="flex" alignItems="center" justifyContent="center" fontSize="xl">
                          {device.icon}
                        </Box>
                        <Box>
                          <Text fontWeight="700" color="white" fontSize="sm">{device.name}</Text>
                          <Text fontSize="xs" color="whiteAlpha.400">{device.type}</Text>
                        </Box>
                      </HStack>
                      <HStack spacing={2}>
                        <HStack spacing={1}>
                          <FiZap color="#38a169" size={11} />
                          <Text fontSize="10px" color="whiteAlpha.500">{device.battery}%</Text>
                        </HStack>
                        {connectingDeviceId === device.id ? (
                          <Badge colorScheme="blue" variant="subtle" fontSize="9px" px={3} py={1} borderRadius="full">
                            <HStack spacing={1}><Spinner size="xs" /><Text>{t('connecting')}</Text></HStack>
                          </Badge>
                        ) : (
                          <Badge colorScheme="blue" variant="outline" fontSize="9px" px={3} py={1} borderRadius="full" cursor="pointer">
                            {t('connectDevice')}
                          </Badge>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* False Alarm Prevention Modal */}
      <Modal isOpen={criticalAlert} onClose={cancelFalseAlarm} isCentered closeOnOverlayClick={false}>
        <ModalOverlay bg="rgba(229,62,62,0.8)" backdropFilter="blur(10px)" />
        <ModalContent bg="#0f1428" border="2px solid #e53e3e" borderRadius="24px" textAlign="center" p={6} mx={4}>
          <ModalBody>
            <Icon as={FiActivity} color="red.400" boxSize={16} className="pulse-animation" mb={4} />
            <Text fontSize="2xl" fontWeight="900" color="red.400" mb={2}>ABNORMAL VITALS</Text>
            <Text color="whiteAlpha.800" mb={6}>Your wearable device has detected critically abnormal vitals. An ambulance will be automatically dispatched in:</Text>
            
            <Text fontSize="6xl" fontWeight="900" color="white" mb={6}>{alertCountdown}</Text>
            
            <VStack spacing={4}>
              <Button w="100%" size="lg" colorScheme="gray" variant="outline" onClick={cancelFalseAlarm}>
                I AM OKAY (Cancel SOS)
              </Button>
              <Button 
                w="100%" 
                size="lg" 
                colorScheme="red" 
                onClick={() => {
                  clearInterval(alertTimerRef.current);
                  setCriticalAlert(false);
                  const sosBtn = document.getElementById('sos-trigger-btn');
                  if (sosBtn) sosBtn.click();
                }}
              >
                SEND SOS NOW
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default WearableHealthMonitor;
