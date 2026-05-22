import { useState } from 'react';
import { Box, VStack, HStack, Text, Input, Button, Heading, FormControl, FormLabel, InputGroup, InputLeftElement, useToast, Container } from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { authService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      toast({ title: 'Welcome back!', status: 'success', duration: 3000, position: 'top-right' });
      navigate(`/dashboard/${data.user.role}`);
    } catch (err) {
      toast({ title: 'Login failed', description: err.response?.data?.message || 'Invalid credentials', status: 'error', duration: 4000, position: 'top-right' });
    } finally { setLoading(false); }
  };

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px">
      <Box position="fixed" top="-20%" left="-10%" w="600px" h="600px" borderRadius="full" bg="radial-gradient(circle, rgba(229,62,62,0.06) 0%, transparent 70%)" filter="blur(60px)" pointerEvents="none" />
      <Container maxW="460px" py={10}>
        <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <VStack spacing={8}>
            <VStack spacing={3}>
              <Box bg="linear-gradient(135deg, #e53e3e 0%, #0080e6 100%)" p={3} borderRadius="16px"><MdLocalHospital size={28} color="white" /></Box>
              <Heading fontSize="2xl" fontWeight="800">{t('welcomeBack')}</Heading>
              <Text color="whiteAlpha.500" fontSize="sm">{t('signInDesc')}</Text>
            </VStack>
            <Box as="form" onSubmit={handleSubmit} w="100%" bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.08)" borderRadius="24px" p={8} backdropFilter="blur(20px)">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('email')}</FormLabel>
                  <InputGroup><InputLeftElement><FiMail color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" pl={10} /></InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.600" fontWeight="600">{t('password')}</FormLabel>
                  <InputGroup><InputLeftElement><FiLock color="rgba(255,255,255,0.3)" /></InputLeftElement><Input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" pl={10} /></InputGroup>
                </FormControl>
                <Button type="submit" w="100%" size="lg" bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)" color="white" h="52px" borderRadius="14px" fontWeight="700" isLoading={loading} rightIcon={<FiArrowRight />} _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(229,62,62,0.4)' }} transition="all 0.3s">{t('signIn')}</Button>
                <Text fontSize="sm" color="whiteAlpha.500">{t('noAccount')} <Link to="/signup"><Text as="span" color="brand.400" fontWeight="600">{t('createOne')}</Text></Link></Text>
              </VStack>
            </Box>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default Login;
