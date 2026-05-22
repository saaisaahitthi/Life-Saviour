import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, VStack, HStack, Text, Button, Icon, Flex, 
  SimpleGrid, Badge, IconButton, useToast, Progress,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, useDisclosure, Image, Select
} from '@chakra-ui/react';
import { 
  FiFile, FiUpload, FiDownload, FiTrash2, 
  FiEye, FiPlus, FiFileText, FiImage 
} from 'react-icons/fi';
import api from '../services/api';
import { getSocket } from '../services/socket';

const DocumentManager = ({ emergencyId, initialAttachments = [], role }) => {
  const { t } = useLanguage();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const socket = getSocket();
    socket.on('new_attachment', (data) => {
      if (data.emergencyId === emergencyId) {
        setAttachments(prev => [...prev, data.attachment]);
      }
    });
    return () => socket.off('new_attachment');
  }, [emergencyId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);
    setUploading(true);
    setUploadProgress(10);

    try {
      const { data } = await api.post(`/files/upload/${emergencyId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      toast({ title: t('fileUploadedToast'), status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: t('uploadFailedToast'), description: err.response?.data?.message, status: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openPreview = (url) => {
    setPreviewUrl(`http://localhost:5000${url}`);
    onOpen();
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return FiImage;
    if (type.includes('pdf')) return FiFileText;
    return FiFile;
  };

  return (
    <Box bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.06)" borderRadius="20px" p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <HStack>
          <Icon as={FiFile} color="brand.400" />
          <Text fontWeight="800" fontSize="sm">{t('medicalDocuments')}</Text>
          <Badge borderRadius="full" px={2} colorScheme="blue">{attachments.length}</Badge>
        </HStack>
        {role === 'patient' && (
          <HStack>
            <Select 
              size="xs" 
              w="120px" 
              bg="rgba(255,255,255,0.05)" 
              border="none" 
              borderRadius="8px"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="prescription" style={{ background: '#0f1428' }}>{t('prescriptionDoc')}</option>
              <option value="scan" style={{ background: '#0f1428' }}>{t('scanDoc')}</option>
              <option value="blood_report" style={{ background: '#0f1428' }}>{t('bloodReportDoc')}</option>
              <option value="x-ray" style={{ background: '#0f1428' }}>{t('xrayDoc')}</option>
              <option value="injury_image" style={{ background: '#0f1428' }}>{t('injuryImageDoc')}</option>
              <option value="discharge_summary" style={{ background: '#0f1428' }}>{t('dischargeDoc')}</option>
              <option value="other" style={{ background: '#0f1428' }}>{t('otherDoc')}</option>
            </Select>
            <Button 
              size="xs" 
              leftIcon={<FiPlus />} 
              colorScheme="blue" 
              variant="solid" 
              onClick={() => fileInputRef.current.click()}
              isLoading={uploading}
            >{t('upload')}</Button>
          </HStack>
        )}
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
      </Flex>

      {uploading && (
        <VStack align="stretch" mb={4} spacing={1}>
          <Text fontSize="10px" color="whiteAlpha.500">{t('uploadingDocument')}</Text>
          <Progress value={uploadProgress} size="xs" colorScheme="blue" borderRadius="full" bg="whiteAlpha.100" />
        </VStack>
      )}

      {attachments.length === 0 ? (
        <Flex direction="column" align="center" py={8} border="1px dashed rgba(255,255,255,0.1)" borderRadius="16px">
          <Icon as={role === 'patient' ? FiUpload : FiFileText} boxSize={6} color="whiteAlpha.200" mb={2} />
          <Text fontSize="xs" color="whiteAlpha.300">{t('noMedicalFiles')}</Text>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {attachments.map((file, i) => (
            <Box key={i} p={3} bg="rgba(15,20,40,0.4)" border="1px solid rgba(255,255,255,0.04)" borderRadius="14px" _hover={{ border: '1px solid rgba(255,255,255,0.1)' }} transition="all 0.2s">
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Box p={2} bg="rgba(0,128,230,0.1)" borderRadius="8px">
                    <Icon as={getFileIcon(file.fileType)} color="blue.300" />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <HStack>
                      <Text fontSize="xs" fontWeight="700" color="white" noOfLines={1} maxW="100px">{file.fileName}</Text>
                      <Badge fontSize="8px" colorScheme="blue" variant="subtle">{file.category || 'other'}</Badge>
                    </HStack>
                    <Text fontSize="10px" color="whiteAlpha.400">{new Date(file.createdAt).toLocaleDateString()}</Text>
                  </VStack>
                </HStack>
                <HStack spacing={1}>
                  <IconButton icon={<FiEye />} size="xs" variant="ghost" color="whiteAlpha.600" aria-label="Preview" onClick={() => openPreview(file.fileUrl)} />
                  <IconButton as="a" href={`http://localhost:5000${file.fileUrl}`} download icon={<FiDownload />} size="xs" variant="ghost" color="whiteAlpha.600" aria-label="Download" />
                </HStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay backdropFilter="blur(20px)" />
        <ModalContent bg="#0a0e1a" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px">
          <ModalHeader color="white" fontSize="md">{t('documentPreview')}</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={10}>
            {previewUrl?.endsWith('.pdf') ? (
              <iframe src={previewUrl} width="100%" height="600px" style={{ borderRadius: '12px', border: 'none' }} />
            ) : (
              <Flex justify="center" bg="rgba(0,0,0,0.5)" borderRadius="16px" overflow="hidden">
                <Image src={previewUrl} maxH="70vh" objectFit="contain" />
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DocumentManager;
