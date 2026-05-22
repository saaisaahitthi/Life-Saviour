import {
  Box, Flex, Text, Button, HStack, IconButton, useDisclosure,
  Drawer, DrawerOverlay, DrawerContent, DrawerBody, DrawerCloseButton,
  VStack, Badge, Avatar, useToast
} from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiLogOut, FiHome, FiActivity, FiMessageCircle, FiUser, FiServer } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { motion } from 'framer-motion';
import NotificationBell from '../components/NotificationBell';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useLanguage();
  const toast = useToast();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('activeEmergencyId');
    localStorage.removeItem('medicalProfile');
    localStorage.removeItem('connectedWearable');
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role) return `/dashboard/${role}`;
    return '/';
  };

  const navLinks = token
    ? [
        { label: t('dashboard'), path: getDashboardPath(), icon: <FiHome /> },
        { label: t('emergencyChat'), path: '/chat', icon: <FiMessageCircle /> },
        ...(role === 'doctor' || role === 'admin' ? [
          { label: t('analytics') || 'Analytics', path: '/dashboard/analytics', icon: <FiActivity /> },
          { label: t('commandCenter') || 'Command Center', path: '/dashboard/command-center', icon: <MdLocalHospital /> }
        ] : []),
        ...(role === 'admin' ? [
          { label: 'Admin Panel', path: '/dashboard/admin', icon: <FiServer /> }
        ] : [])
      ]
    : [
        { label: t('home'), path: '/', icon: <FiHome /> },
        { label: t('login'), path: '/login', icon: <FiUser /> },
        { label: t('signup'), path: '/signup', icon: <FiActivity /> },
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      bg="rgba(10, 14, 26, 0.85)"
      backdropFilter="blur(20px)"
      borderBottom="1px solid rgba(255, 255, 255, 0.06)"
      px={{ base: 4, md: 8 }}
      py={3}
    >
      <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
        {/* Logo */}
        <Link to={token ? getDashboardPath() : '/'}>
          <HStack spacing={3} cursor="pointer" _hover={{ opacity: 0.9 }} transition="all 0.3s">
            <Box
              bg="linear-gradient(135deg, #e53e3e 0%, #0080e6 100%)"
              p={2}
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdLocalHospital size={22} color="white" />
            </Box>
            <Text
              fontSize="xl"
              fontWeight="800"
              bgGradient="linear(to-r, #e53e3e, #0080e6, #00bcd4)"
              bgClip="text"
              letterSpacing="-0.5px"
            >
              Life Saviour
            </Text>
          </HStack>
        </Link>

        {/* Desktop Nav */}
        <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={(e) => {
                if (link.path === '/chat' && !localStorage.getItem('activeEmergencyId')) {
                    e.preventDefault();
                    toast({ title: t('noActiveEmergencyTitle') || 'No Active Emergency', description: t('noActiveEmergencyDesc') || 'Please report an emergency first to access the live chat channel.', status: 'warning', duration: 4000, position: 'top-right' });
                }
            }}>
              <Button
                variant="ghost"
                size="sm"
                color={isActive(link.path) ? 'brand.400' : 'whiteAlpha.700'}
                bg={isActive(link.path) ? 'rgba(0, 128, 230, 0.1)' : 'transparent'}
                borderRadius="10px"
                leftIcon={link.icon}
                _hover={{
                  bg: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                }}
                transition="all 0.3s"
                fontWeight="500"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </HStack>

        {/* Right Side */}
        <HStack spacing={3}>
          <LanguageSelector />
          {token && <NotificationBell />}
          {token && (
            <HStack
              display={{ base: 'none', md: 'flex' }}
              spacing={3}
              bg="rgba(255, 255, 255, 0.05)"
              px={4}
              py={2}
              borderRadius="12px"
              border="1px solid rgba(255, 255, 255, 0.08)"
            >
              <Avatar size="xs" name={userName} bg="brand.500" />
              <Text fontSize="sm" color="whiteAlpha.800" fontWeight="500">
                {userName}
              </Text>
              <Badge
                colorScheme={role === 'doctor' ? 'green' : role === 'driver' ? 'orange' : 'blue'}
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="6px"
                textTransform="capitalize"
              >
                {role}
              </Badge>
            </HStack>
          )}

          {token && (
            <Button
              display={{ base: 'none', md: 'flex' }}
              variant="ghost"
              size="sm"
              color="whiteAlpha.600"
              onClick={handleLogout}
              leftIcon={<FiLogOut />}
              _hover={{ color: 'emergency.400', bg: 'rgba(229, 62, 62, 0.1)' }}
              borderRadius="10px"
            >
              {t('logout')}
            </Button>
          )}

          {/* Mobile Menu */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            icon={<FiMenu />}
            variant="ghost"
            color="whiteAlpha.800"
            onClick={onOpen}
            aria-label="Menu"
          />
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right">
        <DrawerOverlay backdropFilter="blur(8px)" />
        <DrawerContent bg="#0a0e1a" borderLeft="1px solid rgba(255, 255, 255, 0.08)">
          <DrawerCloseButton color="whiteAlpha.700" />
          <DrawerBody pt={16}>
            <VStack spacing={2} align="stretch">
              {token && (
                <HStack
                  spacing={3}
                  bg="rgba(255, 255, 255, 0.05)"
                  px={4}
                  py={3}
                  borderRadius="12px"
                  mb={4}
                >
                  <Avatar size="sm" name={userName} bg="brand.500" />
                  <Box>
                    <Text fontSize="sm" fontWeight="600">{userName}</Text>
                    <Badge
                      colorScheme={role === 'doctor' ? 'green' : role === 'driver' ? 'orange' : 'blue'}
                      fontSize="10px"
                      textTransform="capitalize"
                    >
                      {role}
                    </Badge>
                  </Box>
                </HStack>
              )}
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={(e) => {
                    if (link.path === '/chat' && !localStorage.getItem('activeEmergencyId')) {
                        e.preventDefault();
                        toast({ title: t('noActiveEmergencyTitle') || 'No Active Emergency', description: t('noActiveEmergencyDesc') || 'Please report an emergency first to access the live chat channel.', status: 'warning', duration: 4000, position: 'top-right' });
                    } else {
                        onClose();
                    }
                }}>
                  <Button
                    variant="ghost"
                    w="100%"
                    justifyContent="flex-start"
                    color={isActive(link.path) ? 'brand.400' : 'whiteAlpha.700'}
                    bg={isActive(link.path) ? 'rgba(0, 128, 230, 0.1)' : 'transparent'}
                    leftIcon={link.icon}
                    _hover={{ bg: 'rgba(255, 255, 255, 0.08)' }}
                    borderRadius="10px"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {token && (
                <Button
                  variant="ghost"
                  w="100%"
                  justifyContent="flex-start"
                  color="emergency.400"
                  onClick={() => { handleLogout(); onClose(); }}
                  leftIcon={<FiLogOut />}
                  _hover={{ bg: 'rgba(229, 62, 62, 0.1)' }}
                  borderRadius="10px"
                  mt={4}
                >
                  {t('logout')}
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
