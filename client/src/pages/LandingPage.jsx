import {
  Box, Flex, Text, Button, VStack, HStack, SimpleGrid,
  Container, Icon, Heading, Badge
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiShield, FiClock, FiUsers, FiActivity,
  FiMapPin, FiMessageCircle, FiHeart, FiZap
} from 'react-icons/fi';
import { MdLocalHospital, MdEmergency } from 'react-icons/md';
import { useLanguage } from '../contexts/LanguageContext';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const LandingPage = () => {
  const { t } = useLanguage();
  const stats = [
    { number: '10K+', label: t('statLivesSaved'), icon: FiHeart },
    { number: '<3min', label: t('statResponseTime'), icon: FiClock },
    { number: '500+', label: t('statHospitalsConnected'), icon: MdLocalHospital },
    { number: '24/7', label: t('statAlwaysActive'), icon: FiShield },
  ];

  const features = [
    {
      icon: MdEmergency,
      title: t('featInstantReportingTitle'),
      description: t('featInstantReportingDesc'),
      color: '#e53e3e',
    },
    {
      icon: FiMessageCircle,
      title: t('featRealTimeChatTitle'),
      description: t('featRealTimeChatDesc'),
      color: '#00bcd4',
    },
    {
      icon: FiUsers,
      title: t('featSmartDoctorTitle'),
      description: t('featSmartDoctorDesc'),
      color: '#0080e6',
    },
    {
      icon: FiMapPin,
      title: t('featAmbulanceDispatchTitle'),
      description: t('featAmbulanceDispatchDesc'),
      color: '#38a169',
    },
    {
      icon: FiActivity,
      title: t('featLiveStatusTitle'),
      description: t('featLiveStatusDesc'),
      color: '#d69e2e',
    },
    {
      icon: FiZap,
      title: t('featSeverityTriageTitle'),
      description: t('featSeverityTriageDesc'),
      color: '#9f7aea',
    },
  ];

  return (
    <Box minH="100vh" bg="#0a0e1a" overflow="hidden">
      {/* Ambient Background Effects */}
      <Box
        position="fixed"
        top="-30%"
        right="-20%"
        w="800px"
        h="800px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 128, 230, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="fixed"
        bottom="-30%"
        left="-20%"
        w="800px"
        h="800px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(229, 62, 62, 0.06) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      {/* Hero Section */}
      <Container maxW="1400px" pt={{ base: '120px', md: '160px' }} pb={20} px={{ base: 4, md: 8 }}>
        <MotionFlex
          direction="column"
          align="center"
          textAlign="center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <MotionBox variants={fadeInUp}>
            <Badge
              bg="rgba(229, 62, 62, 0.15)"
              color="emergency.300"
              px={4}
              py={1.5}
              borderRadius="full"
              fontSize="xs"
              fontWeight="700"
              letterSpacing="1px"
              textTransform="uppercase"
              border="1px solid rgba(229, 62, 62, 0.3)"
              mb={6}
            >
              🚨 Emergency Response Platform
            </Badge>
          </MotionBox>

          <MotionBox variants={fadeInUp}>
            <Heading
              as="h1"
              fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
              fontWeight="900"
              lineHeight="1.1"
              mb={6}
              maxW="900px"
            >
              <Text as="span" color="white">{t('saveLivesCoord')} </Text>
              <Text
                as="span"
                bgGradient="linear(to-r, #e53e3e, #0080e6, #00bcd4)"
                bgClip="text"
              >
                {t('realTime')}
              </Text>
              <br />
              <Text as="span" color="white">{t('emergencyCoord')}</Text>
            </Heading>
          </MotionBox>

          <MotionBox variants={fadeInUp}>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              color="whiteAlpha.600"
              maxW="650px"
              mb={10}
              lineHeight="1.8"
            >
              {t('heroDesc')}
            </Text>
          </MotionBox>

          <MotionBox variants={fadeInUp}>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Link to="/signup">
                <Button
                  size="lg"
                  bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)"
                  color="white"
                  px={8}
                  h="56px"
                  fontSize="md"
                  fontWeight="700"
                  borderRadius="14px"
                  rightIcon={<FiArrowRight />}
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(229, 62, 62, 0.4)',
                  }}
                  transition="all 0.3s"
                >
                  {t('reportEmergencyBtn')}
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="whiteAlpha.300"
                  color="white"
                  px={8}
                  h="56px"
                  fontSize="md"
                  fontWeight="600"
                  borderRadius="14px"
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'brand.400',
                    transform: 'translateY(-3px)',
                  }}
                  transition="all 0.3s"
                >
                  {t('signInBtn')}
                </Button>
              </Link>
            </HStack>
          </MotionBox>

          {/* Command Center Preview */}
          <MotionBox variants={fadeInUp} w="100%" mt={16}>
            <Box
              bg="rgba(15, 20, 40, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="24px"
              p={{ base: 4, md: 8 }}
              backdropFilter="blur(20px)"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="1px"
                bgGradient="linear(to-r, transparent, brand.400, transparent)"
              />
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* Active Emergencies Card */}
                <Box
                  bg="rgba(229, 62, 62, 0.08)"
                  border="1px solid rgba(229, 62, 62, 0.2)"
                  borderRadius="16px"
                  p={6}
                >
                  <HStack mb={3}>
                    <Box w={2} h={2} borderRadius="full" bg="#e53e3e" boxShadow="0 0 8px #e53e3e" />
                    <Text fontSize="xs" color="emergency.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
                      {t('previewActiveEmergency')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="800" color="white" mb={1}>{t('previewCritical')}</Text>
                  <Text fontSize="sm" color="whiteAlpha.500">{t('previewCardiacArrest')}</Text>
                  <HStack mt={4} spacing={2}>
                    <Badge bg="rgba(229, 62, 62, 0.2)" color="emergency.300" px={2} borderRadius="6px" fontSize="10px">
                      {t('previewPriority1')}
                    </Badge>
                    <Badge bg="rgba(0, 188, 212, 0.2)" color="teal.300" px={2} borderRadius="6px" fontSize="10px">
                      {t('previewEnRoute')}
                    </Badge>
                  </HStack>
                </Box>

                {/* Ambulance Status */}
                <Box
                  bg="rgba(0, 128, 230, 0.08)"
                  border="1px solid rgba(0, 128, 230, 0.2)"
                  borderRadius="16px"
                  p={6}
                >
                  <HStack mb={3}>
                    <Box w={2} h={2} borderRadius="full" bg="#0080e6" boxShadow="0 0 8px #0080e6" />
                    <Text fontSize="xs" color="brand.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
                      {t('previewAmbulanceUnit')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="800" color="white" mb={1}>AMB-042</Text>
                  <Text fontSize="sm" color="whiteAlpha.500">{t('previewETA4Min')}</Text>
                  <HStack mt={4} spacing={2}>
                    <Badge bg="rgba(56, 161, 105, 0.2)" color="green.300" px={2} borderRadius="6px" fontSize="10px">
                      {t('previewDispatched')}
                    </Badge>
                  </HStack>
                </Box>

                {/* Hospital Status */}
                <Box
                  bg="rgba(0, 188, 212, 0.08)"
                  border="1px solid rgba(0, 188, 212, 0.2)"
                  borderRadius="16px"
                  p={6}
                >
                  <HStack mb={3}>
                    <Box w={2} h={2} borderRadius="full" bg="#00bcd4" boxShadow="0 0 8px #00bcd4" />
                    <Text fontSize="xs" color="teal.300" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
                      {t('previewHospitalReady')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="800" color="white" mb={1}>{t('previewCityGeneral')}</Text>
                  <Text fontSize="sm" color="whiteAlpha.500">{t('previewEmergencyWard')}</Text>
                  <HStack mt={4} spacing={2}>
                    <Badge bg="rgba(0, 188, 212, 0.2)" color="teal.300" px={2} borderRadius="6px" fontSize="10px">
                      {t('previewStandby')}
                    </Badge>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>
          </MotionBox>
        </MotionFlex>
      </Container>

      {/* Stats Section */}
      <Box bg="rgba(15, 20, 40, 0.4)" py={16} borderTop="1px solid rgba(255,255,255,0.04)" borderBottom="1px solid rgba(255,255,255,0.04)">
        <Container maxW="1200px">
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={8}>
            {stats.map((stat, i) => (
              <MotionBox
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                textAlign="center"
              >
                <Icon as={stat.icon} boxSize={6} color="brand.400" mb={3} />
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="900" color="white" mb={1}>
                  {stat.number}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.500" fontWeight="500">
                  {stat.label}
                </Text>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="1200px" py={20} px={{ base: 4, md: 8 }}>
        <VStack spacing={4} textAlign="center" mb={16}>
          <Badge
            bg="rgba(0, 128, 230, 0.15)"
            color="brand.300"
            px={4}
            py={1.5}
            borderRadius="full"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="1px"
            textTransform="uppercase"
          >
            {t('platformFeatures')}
          </Badge>
          <Heading fontSize={{ base: '2xl', md: '4xl' }} fontWeight="800" color="white">
            {t('builtFor')}{' '}
            <Text as="span" bgGradient="linear(to-r, #0080e6, #00bcd4)" bgClip="text">
              {t('lifeSaving')}
            </Text>{' '}
            {t('speed')}
          </Heading>
          <Text color="whiteAlpha.500" maxW="600px" fontSize="md">
            {t('featuresDesc')}
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {features.map((feature, i) => (
            <MotionBox
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              bg="rgba(15, 20, 40, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.06)"
              borderRadius="20px"
              p={8}
              backdropFilter="blur(20px)"
              cursor="pointer"
              _hover={{
                border: `1px solid ${feature.color}33`,
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 35px ${feature.color}15`,
              }}
              transition="all 0.3s ease"
            >
              <Box
                w="50px"
                h="50px"
                borderRadius="14px"
                bg={`${feature.color}18`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={5}
              >
                <Icon as={feature.icon} boxSize={6} color={feature.color} />
              </Box>
              <Text fontSize="lg" fontWeight="700" color="white" mb={3}>
                {feature.title}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.500" lineHeight="1.7">
                {feature.description}
              </Text>
            </MotionBox>
          ))}
        </SimpleGrid>
      </Container>

      {/* CTA Section */}
      <Box py={20}>
        <Container maxW="800px">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            bg="linear-gradient(135deg, rgba(229, 62, 62, 0.15) 0%, rgba(0, 128, 230, 0.15) 100%)"
            border="1px solid rgba(255, 255, 255, 0.08)"
            borderRadius="24px"
            p={{ base: 8, md: 12 }}
            textAlign="center"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              h="1px"
              bgGradient="linear(to-r, transparent, emergency.400, brand.400, transparent)"
            />
            <Heading fontSize={{ base: 'xl', md: '3xl' }} fontWeight="800" color="white" mb={4}>
              {t('everySecondCounts')}
            </Heading>
            <Text color="whiteAlpha.600" mb={8} maxW="500px" mx="auto">
              {t('joinNetworkDesc')}
            </Text>
            <HStack spacing={4} justify="center" flexWrap="wrap">
              <Link to="/signup">
                <Button
                  size="lg"
                  bg="linear-gradient(135deg, #e53e3e 0%, #c53030 100%)"
                  color="white"
                  px={8}
                  borderRadius="14px"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(229, 62, 62, 0.4)',
                  }}
                  transition="all 0.3s"
                >
                  {t('getStartedNow')}
                </Button>
              </Link>
            </HStack>
          </MotionBox>
        </Container>
      </Box>

      {/* Footer */}
      <Box borderTop="1px solid rgba(255,255,255,0.06)" py={8}>
        <Container maxW="1200px">
          <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
            <HStack spacing={3}>
              <Box bg="linear-gradient(135deg, #e53e3e 0%, #0080e6 100%)" p={1.5} borderRadius="8px">
                <MdLocalHospital size={16} color="white" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="whiteAlpha.600">
                Life Saviour
              </Text>
            </HStack>
            <Text fontSize="xs" color="whiteAlpha.400">
              {t('footerText')}
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
