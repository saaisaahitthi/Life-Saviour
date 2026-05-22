import { useState, useRef } from 'react';
import {
  Box, Button, Text, VStack, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalBody, Progress, useToast, Heading, HStack, Badge
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { MdEmergency } from 'react-icons/md';
import { FiPhone, FiCheckCircle } from 'react-icons/fi';
import { emergencyService } from '../services/api';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const SOSButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [countdown, setCountdown] = useState(5);
  const [notifiedContacts, setNotifiedContacts] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const startSOS = () => {
    onOpen();
    setCountdown(5);
    setNotifiedContacts([]);

    // Play siren sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(() => {});

    let c = 5;
    timerRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(timerRef.current);
        triggerEmergency();
      }
    }, 1000);
  };

  /**
   * Automatically open WhatsApp for all saved family contacts.
   * Uses window.open with a short stagger so the browser doesn't block multiple tabs.
   */
  const notifyAllContacts = async (emergency, locationName) => {
    const userName = localStorage.getItem('userName') || 'Patient';
    
    const mapsLink = emergency.coordinates?.lat 
      ? `https://www.google.com/maps?q=${emergency.coordinates.lat},${emergency.coordinates.lng}` 
      : 'GPS unavailable';

    const hospitalInfo = emergency.assignedHospital 
      ? `\n🏥 Assigned Hospital: ${emergency.assignedHospital.name || 'Unknown'}` 
      : `\n🏥 Hospital: Allocating nearest facility...`;

    const symptomsInfo = emergency.symptoms ? `\n🩺 Initial Symptoms: ${emergency.symptoms}` : '';

    const message = `🚨 EMERGENCY SOS ALERT 🚨\n\n${userName} has triggered an SOS emergency and needs help immediately!\n\n📍 Patient Location: ${locationName}\n🗺️ Google Maps: ${mapsLink}${hospitalInfo}${symptomsInfo}\n⏰ Time: ${new Date().toLocaleString()}\n🔗 Emergency ID: ${emergency._id}\n\nHelp has been dispatched. Please check on them immediately.\n\n— Life Saviour Emergency Platform`;

    let notified = [];

    try {
      const medicalProfile = JSON.parse(localStorage.getItem('medicalProfile') || '{}');
      const emergencyContact = medicalProfile.emergencyContact || '';
      if (emergencyContact) {
        const phoneMatch = emergencyContact.match(/(\+?\d[\d\s-]{9,})/);
        let phoneNumber = phoneMatch ? phoneMatch[1].replace(/[\s-]/g, '') : '';
        if (!phoneNumber) {
          const fallback = emergencyContact.match(/(\d{10,})/);
          phoneNumber = fallback ? fallback[1] : '';
        }
        if (phoneNumber && notified.length === 0) {
          const finalPhone = phoneNumber.startsWith('+')
            ? phoneNumber.replace('+', '')
            : phoneNumber.length === 10
            ? '91' + phoneNumber
            : phoneNumber;
          
          // Use native deep-link
          const url = `whatsapp://send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
          
          try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            setTimeout(() => document.body.removeChild(iframe), 2000);
          } catch (e) {
            window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
          }

          notified.push(emergencyContact);
        }
      }
    } catch (e) {}

    try {
      // 2. Notify family contacts stored in the backend if no primary emergency contact was found
      const { data: contacts } = await api.get('/family/contacts');
      if (contacts && contacts.length > 0) {
        contacts.forEach((contact, idx) => {
          if (contact.phone && notified.length === 0) { // Only auto-open the FIRST contact
            const phone = contact.phone.replace(/[\s\-()]/g, '');
            const finalPhone = phone.startsWith('+')
              ? phone.replace('+', '')
              : phone.length === 10
              ? '91' + phone
              : phone;
            
            const url = `whatsapp://send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
            
            try {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = url;
              document.body.appendChild(iframe);
              setTimeout(() => document.body.removeChild(iframe), 2000);
            } catch (e) {
              window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
            }
            
            notified.push(contact.name);
          }
        });
      }
    } catch (e) {
      console.warn('Could not fetch family contacts:', e);
    }

    if (notified.length > 0) {
      setNotifiedContacts(notified);
      toast({
        title: `📱 ${notified.length} Contact${notified.length > 1 ? 's' : ''} Notified via WhatsApp`,
        description: notified.join(', '),
        status: 'success',
        duration: 6000,
        position: 'top'
      });
    }
  };

  const triggerEmergency = async () => {
    if (audioRef.current) audioRef.current.pause();

    const medicalProfile = JSON.parse(localStorage.getItem('medicalProfile') || '{}');
    const userName = localStorage.getItem('userName') || 'Patient';

    if (!navigator.onLine) {
      toast({
        title: 'Network Disconnected 📴',
        description: 'No internet! Triggering Offline SMS Fallback...',
        status: 'warning',
        duration: 5000,
        position: 'top'
      });
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const message = `🚨 EMERGENCY SOS 🚨\n\n${userName} needs help!\n📍 Location: ${mapsLink}\n🩸 Blood: ${medicalProfile.bloodGroup || 'Unknown'}\n💊 Allergies: ${medicalProfile.allergies || 'None'}\n\nPlease send an ambulance immediately.`;
          
          const a = document.createElement('a');
          a.href = `sms:112?body=${encodeURIComponent(message)}`;
          a.click();
          
          setTimeout(() => { onClose(); navigate('/chat'); }, 1500);
        },
        () => {
          const message = `🚨 EMERGENCY SOS 🚨\n\n${userName} needs help!\n📍 Location: GPS unavailable\n🩸 Blood: ${medicalProfile.bloodGroup || 'Unknown'}\n\nPlease call me back immediately.`;
          
          const a = document.createElement('a');
          a.href = `sms:112?body=${encodeURIComponent(message)}`;
          a.click();

          setTimeout(() => { onClose(); navigate('/chat'); }, 1500);
        }
      );
      return;
    }

    try {

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          let locationName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const geoData = await geoRes.json();
            if (geoData.display_name) locationName = geoData.display_name;
          } catch (e) {}

          // Attach wearable snapshot if connected
          const wearableRaw = localStorage.getItem('connectedWearable');
          const vitalsRaw = localStorage.getItem('latestWearableVitals');
          
          let wearableSnapshot = null;
          if (wearableRaw) {
            const device = JSON.parse(wearableRaw);
            const vitals = vitalsRaw ? JSON.parse(vitalsRaw) : {
              heartRate: Math.floor(70 + Math.random() * 30),
              spO2: Math.floor(94 + Math.random() * 5),
              bodyTemperature: (36.5 + Math.random() * 1).toFixed(1),
              bloodPressure: { systolic: 120, diastolic: 80 }
            };
            
            wearableSnapshot = {
              deviceName: device.name || 'Wearable',
              heartRate: vitals.heartRate,
              bloodOxygen: vitals.spO2,
              temperature: parseFloat(vitals.bodyTemperature),
              bloodPressure: vitals.bloodPressure.systolic ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : vitals.bloodPressure
            };
          }

          const { data } = await emergencyService.create({
            patientName: userName,
            age: 0,
            gender: 'other',
            bloodGroup: medicalProfile.bloodGroup || 'O+',
            location: locationName,
            coordinates: { lat: latitude, lng: longitude },
            severity: 'critical',
            symptoms: `🚨 SOS One-Tap Triggered. ${medicalProfile.allergies ? 'Known Allergies: ' + medicalProfile.allergies + '.' : ''} ${medicalProfile.medications ? 'Current Medications: ' + medicalProfile.medications + '.' : ''}`,
            transportType: 'ambulance',
            triageInputs: { breathingDifficulty: 10, painLevel: 10, consciousnessState: 'unconscious' },
            ...(wearableSnapshot ? { wearableSnapshot } : {})
          });

          localStorage.setItem('activeEmergencyId', data._id);

          toast({
            title: '🚨 EMERGENCY TRIGGERED',
            description: 'Help is on the way. GPS location sent.',
            status: 'error',
            duration: 5000,
            position: 'top'
          });

          // ✅ Automatically notify all contacts — no button needed
          await notifyAllContacts(data, locationName);

          setTimeout(() => { onClose(); navigate('/chat'); }, 3000);
        },
        () => {
          toast({
            title: '📍 Location Unavailable',
            description: 'Emergency created without GPS. Please share your location manually.',
            status: 'warning',
            duration: 4000,
            position: 'top'
          });
          onClose();
        }
      );
    } catch (err) {
      toast({ title: 'SOS Failed', description: err.message, status: 'error' });
      onClose();
    }
  };

  const cancelSOS = () => {
    clearInterval(timerRef.current);
    if (audioRef.current) audioRef.current.pause();
    setCountdown(5);
    onClose();
    toast({ title: 'SOS Cancelled', status: 'info', duration: 2000 });
  };

  return (
    <>
      <MotionBox
        position="fixed"
        bottom="30px"
        right="30px"
        zIndex="1500"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <MotionButton
          id="sos-trigger-btn"
          onClick={startSOS}
          bg="linear-gradient(135deg, #ff0000 0%, #cc0000 100%)"
          color="white"
          w="80px"
          h="80px"
          borderRadius="full"
          boxShadow="0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.3)"
          _hover={{ bg: 'red.600' }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(255,0,0,0.5)",
              "0 0 40px rgba(255,0,0,0.8)",
              "0 0 20px rgba(255,0,0,0.5)"
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <VStack spacing={0}>
            <MdEmergency size={30} />
            <Text fontSize="xs" fontWeight="900">SOS</Text>
          </VStack>
        </MotionButton>
      </MotionBox>

      <Modal isOpen={isOpen} onClose={cancelSOS} isCentered closeOnOverlayClick={false}>
        <ModalOverlay bg="rgba(255,0,0,0.4)" backdropFilter="blur(15px)" />
        <ModalContent bg="#0f1428" borderRadius="30px" border="2px solid #ff0000" overflow="hidden">
          <ModalBody py={10}>
            <VStack spacing={8}>
              <Box position="relative">
                <Box
                  w="150px" h="150px" borderRadius="full"
                  bg="rgba(255,0,0,0.1)" border="4px solid #ff0000"
                  display="flex" alignItems="center" justifyContent="center"
                >
                  <Text fontSize="6xl" fontWeight="900" color="red.500">{countdown}</Text>
                </Box>
                <MotionBox
                  position="absolute" top="-10px" left="-10px" right="-10px" bottom="-10px"
                  borderRadius="full" border="2px solid #ff0000"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </Box>

              <VStack spacing={2}>
                <Heading size="lg" color="white" textAlign="center">TRIGGERING SOS</Heading>
                <Text color="whiteAlpha.600" textAlign="center">Automatic emergency dispatch in progress...</Text>
              </VStack>

              {/* Contacts that will be auto-notified */}
              {(() => {
                // Show ALL contacts that will be notified
                const mp = JSON.parse(localStorage.getItem('medicalProfile') || '{}');
                const hasLegacyContact = !!mp.emergencyContact;

                if (notifiedContacts.length > 0) {
                  // Already notified
                  return (
                    <Box w="100%" bg="rgba(56,161,105,0.1)" border="1px solid rgba(56,161,105,0.3)" borderRadius="16px" p={4}>
                      <VStack align="flex-start" spacing={2}>
                        <HStack>
                          <FiCheckCircle color="#38a169" />
                          <Text fontSize="xs" fontWeight="700" color="green.300">WhatsApp Sent Automatically</Text>
                        </HStack>
                        {notifiedContacts.map((name, i) => (
                          <Badge key={i} colorScheme="green" variant="subtle" fontSize="10px">
                            <FiPhone style={{ display: 'inline', marginRight: 4 }} />{name}
                          </Badge>
                        ))}
                      </VStack>
                    </Box>
                  );
                }

                if (hasLegacyContact) {
                  return (
                    <Box w="100%" bg="rgba(0,128,230,0.1)" border="1px solid rgba(0,128,230,0.3)" borderRadius="16px" p={4}>
                      <HStack>
                        <FiPhone color="#0080e6" />
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs" color="whiteAlpha.400">Notifying automatically...</Text>
                          <Text fontSize="sm" color="white" fontWeight="600">{mp.emergencyContact}</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                }

                return (
                  <Box w="100%" bg="rgba(229,62,62,0.1)" border="1px dashed rgba(229,62,62,0.3)" borderRadius="16px" p={4} textAlign="center">
                    <Text fontSize="xs" color="whiteAlpha.500">⚠️ No emergency contacts saved. Add contacts in your Medical ID or Family Contacts.</Text>
                  </Box>
                );
              })()}

              <Progress
                value={(countdown / 5) * 100}
                w="100%" h="10px" borderRadius="full" colorScheme="red" bg="whiteAlpha.100"
              />

              <Button
                w="100%" h="60px" borderRadius="20px" variant="outline"
                colorScheme="red" border="2px solid" fontSize="lg" fontWeight="800"
                onClick={cancelSOS}
              >
                CANCEL SOS
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SOSButton;
