import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Text, VStack, HStack, Icon, useToast } from '@chakra-ui/react';
import { QRCodeCanvas } from 'qrcode.react';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

const MedicalQrCode = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const qrRef = useRef(null);

  const [familyContacts, setFamilyContacts] = useState([]);

  useEffect(() => {
    // Fetch family contacts to include in QR code
    api.get('/family/contacts')
      .then(res => {
        if (res.data) setFamilyContacts(res.data);
      })
      .catch(err => console.warn('Could not fetch family contacts for QR:', err));
  }, []);

  const medicalProfile = JSON.parse(localStorage.getItem('medicalProfile') || '{}');
  const userName = localStorage.getItem('userName') || 'Patient';

  // Format data as a clean readable string
  const contactsList = familyContacts.map(c => `- ${c.name}: ${c.phone}`).join('\n');
  
  const qrData = `
🚨 MEDICAL ID - ${userName.toUpperCase()} 🚨
Blood Type: ${medicalProfile.bloodGroup || 'Unknown'}
Allergies: ${medicalProfile.allergies || 'None'}
Medications: ${medicalProfile.medications || 'None'}
Emergency Contact: ${medicalProfile.emergencyContact || 'Not Set'}
${contactsList ? `Family Contacts:\n${contactsList}` : ''}
  `.trim();

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${userName}_Medical_ID_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: 'QR Code Downloaded',
        description: 'Set this as your phone lock screen so responders can scan it.',
        status: 'success',
        duration: 5000,
        position: 'top'
      });
    }
  };

  if (!medicalProfile.bloodGroup) return null;

  return (
    <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="18px" p={6}>
      <HStack mb={4}>
        <Box p={2} bg="rgba(0,188,212,0.15)" borderRadius="10px">
          <MdQrCodeScanner color="#00bcd4" size={24} />
        </Box>
        <Box>
          <Text fontWeight="800" fontSize="lg" color="white">Digital Medical ID</Text>
          <Text fontSize="xs" color="whiteAlpha.400">Download your emergency QR code</Text>
        </Box>
      </HStack>

      <HStack spacing={6} align="center">
        <Box 
          bg="white" 
          p={3} 
          borderRadius="12px" 
          ref={qrRef}
          boxShadow="0 0 15px rgba(0,188,212,0.2)"
        >
          <QRCodeCanvas 
            value={qrData}
            size={120}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"M"}
            includeMargin={false}
          />
        </Box>
        <VStack align="flex-start" spacing={3} flex="1">
          <HStack><FiCheckCircle color="#38a169" /><Text fontSize="sm" color="whiteAlpha.700">Scan to see allergies & blood type</Text></HStack>
          <HStack><FiCheckCircle color="#38a169" /><Text fontSize="sm" color="whiteAlpha.700">Works without internet</Text></HStack>
          <Button 
            size="sm" 
            w="100%" 
            leftIcon={<FiDownload />} 
            bg="linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)" 
            color="white"
            borderRadius="10px"
            onClick={downloadQR}
            _hover={{ transform: 'translateY(-2px)' }}
          >
            Download to Lock Screen
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
};

export default MedicalQrCode;
