import { useState } from 'react';
import {
  Box, VStack, HStack, Text, Input, Button, Select,
  Heading, FormControl, FormLabel, InputGroup, InputLeftElement,
  useToast, Container
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiArrowRight } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { authService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', phone: '', specialization: '', vehicleNumber: '', hospitalAffiliation: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.signup(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      toast({ title: 'Account created', status: 'success', duration: 3000, position: 'top-right' });
      navigate(`/dashboard/${data.user.role}`);
    } catch (err) {
      toast({ title: 'Signup failed', description: err.response?.data?.message || 'Error', status: 'error', duration: 4000, position: 'top-right' });
    } finally { setLoading(false); }
  };

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px">
      <Box position="fixed" top="-20%" right="-10%" w="600px" h="600px" borderRadius="full" bg="radial-gradient(circle, rgba(0,128,230,0.06) 0%, transparent 70%)" filter="blur(60px)" pointerEvents="none" />
      <Container maxW="500px" py={10}>
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <VStack spacing={8}>
            <VStack spacing={3}>
              <Box bg="linear-gradient(135deg, #e53e3e 0%, #0080e6 100%)" p={3} borderRadius="16px"><MdLocalHospital size={28} color="white" /></Box>
              <Heading fontSize="2xl" fontWeight="800">{t('joinLifeSaviour')}</Heading>
              <Text color="whiteAlpha.500" fontSize="sm">{t('signupDesc')}</Text>
            </VStack>
            <Box as="form" onSubmit={handleSubmit} w="100%" bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.08)" borderRadius="24px" p={8} backdropFilter="blur(20px)">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('fullName')}</FormLabel>
                  <InputGroup><InputLeftElement><FiUser color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" pl={10} /></InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('email')}</FormLabel>
                  <InputGroup><InputLeftElement><FiMail color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" pl={10} /></InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('password')}</FormLabel>
                  <InputGroup><InputLeftElement><FiLock color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" pl={10} /></InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('phone')}</FormLabel>
                  <InputGroup><InputLeftElement><FiPhone color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" pl={10} /></InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('role')}</FormLabel>
                  <Select name="role" value={form.role} onChange={handleChange}>
                    <option value="patient" style={{ background: '#0f1428' }}>Patient</option>
                    <option value="doctor" style={{ background: '#0f1428' }}>Doctor</option>
                    <option value="driver" style={{ background: '#0f1428' }}>Ambulance Driver</option>
                    <option value="admin" style={{ background: '#0f1428' }}>System Admin</option>
                  </Select>
                </FormControl>
                {form.role === 'doctor' && (
                  <FormControl>
                    <FormLabel fontSize="sm" color="whiteAlpha.600">{t('specialization')}</FormLabel>
                    <Select name="specialization" value={form.specialization} onChange={handleChange} placeholder="Select Specialization">
                      <option value="general" style={{ background: '#0f1428' }}>General</option>
                      <option value="cardiology" style={{ background: '#0f1428' }}>Cardiology</option>
                      <option value="trauma" style={{ background: '#0f1428' }}>Trauma</option>
                      <option value="neurology" style={{ background: '#0f1428' }}>Neurology</option>
                      <option value="respiratory" style={{ background: '#0f1428' }}>Respiratory</option>
                      <option value="orthopedics" style={{ background: '#0f1428' }}>Orthopedics</option>
                      <option value="pediatrics" style={{ background: '#0f1428' }}>Pediatrics</option>
                    </Select>
                  </FormControl>
                )}
                {form.role === 'doctor' && (
                  <FormControl>
                    <FormLabel fontSize="sm" color="whiteAlpha.600">Hospital Affiliation</FormLabel>
                    <InputGroup>
                      <InputLeftElement><MdLocalHospital color="rgba(255,255,255,0.3)" /></InputLeftElement>
                      <Input name="hospitalAffiliation" value={form.hospitalAffiliation} onChange={handleChange} placeholder="e.g. City General Hospital" pl={10} />
                    </InputGroup>
                  </FormControl>
                )}
                {form.role === 'driver' && <FormControl><FormLabel fontSize="sm" color="whiteAlpha.600">{t('vehicleNumber')}</FormLabel><Input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="e.g. KA-01-AB-1234" /></FormControl>}
                {form.role === 'admin' && (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="red.400" fontWeight="700">Secret Admin Code</FormLabel>
                    <InputGroup>
                      <InputLeftElement><FiLock color="rgba(255,0,0,0.5)" /></InputLeftElement>
                      <Input name="adminCode" type="password" value={form.adminCode} onChange={handleChange} placeholder="Enter Master Passcode" pl={10} borderColor="red.900" focusBorderColor="red.400" />
                    </InputGroup>
                  </FormControl>
                )}
                <Button type="submit" w="100%" size="lg" bg="linear-gradient(135deg, #0080e6 0%, #00bcd4 100%)" color="white" h="52px" borderRadius="14px" fontWeight="700" isLoading={loading} rightIcon={<FiArrowRight />} _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,128,230,0.4)' }} transition="all 0.3s">{t('createAccount')}</Button>
                <Text fontSize="sm" color="whiteAlpha.500">{t('alreadyAccount')} <Link to="/login"><Text as="span" color="brand.400" fontWeight="600">{t('signIn')}</Text></Link></Text>
              </VStack>
            </Box>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default Signup;
