import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Button, Badge, Input,
  SimpleGrid, Flex, IconButton, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalCloseButton, FormControl, FormLabel, Select
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiTrash2, FiPhone, FiMail, FiHeart, FiShield } from 'react-icons/fi';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);

const FamilyContactManager = () => {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: '' });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await api.get('/family/contacts');
      setContacts(data);
    } catch (err) { /* No contacts yet */ }
  };

  const addContact = async () => {
    if (!form.name || !form.phone) {
      toast({ title: 'Name and phone are required', status: 'warning', duration: 2000 });
      return;
    }
    try {
      const { data } = await api.post('/family/contacts', form);
      setContacts(data);
      setForm({ name: '', phone: '', email: '', relationship: '' });
      onClose();
      toast({ title: 'Contact Added', status: 'success', duration: 2000 });
    } catch (err) {
      toast({ title: 'Failed to add contact', status: 'error', duration: 2000 });
    }
  };

  const removeContact = async (id) => {
    try {
      const { data } = await api.delete(`/family/contacts/${id}`);
      setContacts(data);
      toast({ title: 'Contact Removed', status: 'info', duration: 2000 });
    } catch (err) {
      toast({ title: 'Failed', status: 'error', duration: 2000 });
    }
  };

  return (
    <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} mb={8}>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <FiUsers color="rgba(255,255,255,0.4)" />
          <Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
            {t('familyContacts')}
          </Text>
          <Badge colorScheme="blue" fontSize="9px" variant="subtle">{contacts.length}</Badge>
        </HStack>
        <Button size="xs" leftIcon={<FiPlus />} colorScheme="blue" variant="solid" onClick={onOpen}>{t('addContact')}</Button>
      </Flex>

      {contacts.length === 0 ? (
        <Box bg="rgba(15,20,40,0.4)" borderRadius="16px" p={6} textAlign="center" border="1px dashed rgba(255,255,255,0.08)">
          <Icon as={FiShield} boxSize={6} color="whiteAlpha.200" mb={2} />
          <Text fontSize="xs" color="whiteAlpha.400">No emergency contacts added yet</Text>
          <Text fontSize="10px" color="whiteAlpha.300" mt={1}>Add contacts who will be automatically notified during emergencies</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {contacts.map((c, i) => (
            <Box key={c._id || i} bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="16px" p={4} _hover={{ border: '1px solid rgba(0,128,230,0.2)' }} transition="all 0.3s">
              <Flex justify="space-between" align="flex-start">
                <HStack spacing={3}>
                  <Box p={2} bg="rgba(0,128,230,0.1)" borderRadius="10px">
                    <Icon as={FiHeart} color="brand.400" />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="700" fontSize="sm">{c.name}</Text>
                    <Badge fontSize="8px" colorScheme="blue" variant="subtle">{c.relationship || 'Contact'}</Badge>
                  </VStack>
                </HStack>
                <IconButton icon={<FiTrash2 />} size="xs" variant="ghost" color="red.400" onClick={() => removeContact(c._id)} aria-label="Remove" />
              </Flex>
              <HStack mt={3} spacing={4}>
                <HStack spacing={1}><FiPhone size={10} color="rgba(255,255,255,0.3)" /><Text fontSize="10px" color="whiteAlpha.500">{c.phone}</Text></HStack>
                {c.email && <HStack spacing={1}><FiMail size={10} color="rgba(255,255,255,0.3)" /><Text fontSize="10px" color="whiteAlpha.500">{c.email}</Text></HStack>}
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f1428" border="1px solid rgba(255,255,255,0.1)" borderRadius="24px">
          <ModalHeader borderBottom="1px solid rgba(255,255,255,0.06)">
            <HStack><Box bg="rgba(0,128,230,0.15)" p={2} borderRadius="10px"><FiPlus color="#0080e6" /></Box><Text>{t('addContact')}</Text></HStack>
          </ModalHeader>
          <ModalCloseButton color="whiteAlpha.400" />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" color="whiteAlpha.500">{t('contactName')}</FormLabel>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} size="sm" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="xs" color="whiteAlpha.500">{t('phone')}</FormLabel>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} size="sm" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color="whiteAlpha.500">{t('email')}</FormLabel>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} size="sm" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color="whiteAlpha.500">{t('relationship')}</FormLabel>
                <Select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} size="sm">
                  <option value="" style={{ background: '#0f1428' }}>Select</option>
                  <option value="Spouse" style={{ background: '#0f1428' }}>Spouse</option>
                  <option value="Parent" style={{ background: '#0f1428' }}>Parent</option>
                  <option value="Child" style={{ background: '#0f1428' }}>Child</option>
                  <option value="Sibling" style={{ background: '#0f1428' }}>Sibling</option>
                  <option value="Friend" style={{ background: '#0f1428' }}>Friend</option>
                  <option value="Other" style={{ background: '#0f1428' }}>Other</option>
                </Select>
              </FormControl>
              <Button w="100%" colorScheme="blue" borderRadius="14px" onClick={addContact}>Save Contact</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default FamilyContactManager;
