import React, { useState, useEffect } from 'react';
import { Box, Flex, Text, VStack, HStack, Icon, Button, usePrefersReducedMotion } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { MdFavorite, MdLocalHospital, MdWaterDrop, MdLocalFireDepartment } from 'react-icons/md';
import { useLanguage } from '../contexts/LanguageContext';

const pulseKeyframes = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); }
  50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(229, 62, 62, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); }
`;

// 100 BPM = 60s / 100 = 0.6s per beat
const pulseAnimation = `${pulseKeyframes} 0.6s infinite ease-in-out`;

const GUIDES = {
  cpr: {
    title: 'CPR Metronome',
    icon: MdFavorite,
    color: 'red.400',
    instructions: [
      '1. Place hands on the center of the chest.',
      '2. Push hard and fast to the beat of the pulsing heart.',
      '3. Allow chest to come back up to its normal position after each push.'
    ]
  },
  bleeding: {
    title: 'Stop Bleeding',
    icon: MdWaterDrop,
    color: 'red.500',
    instructions: [
      '1. Apply firm, direct pressure to the wound with a clean cloth.',
      '2. If bleeding soaks through, add more cloth on top, do NOT remove the first one.',
      '3. If on a limb and bleeding is severe, consider a tourniquet 2 inches above the wound.'
    ]
  },
  burn: {
    title: 'Treating Burns',
    icon: MdLocalFireDepartment,
    color: 'orange.400',
    instructions: [
      '1. Cool the burn under cool (not cold) running water for 10-15 mins.',
      '2. Remove tight items (rings, watches) from the burned area immediately.',
      '3. Cover loosely with a sterile, non-fluffy dressing or plastic wrap.'
    ]
  }
};

const FirstAidGuide = ({ activeEmergency }) => {
  const { t } = useLanguage();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Determine which guide to show based on symptoms/triage
  let defaultGuide = 'cpr';
  const symptoms = (activeEmergency?.symptoms || '').toLowerCase();
  
  if (symptoms.includes('bleed') || symptoms.includes('cut')) {
    defaultGuide = 'bleeding';
  } else if (symptoms.includes('burn') || symptoms.includes('fire')) {
    defaultGuide = 'burn';
  }

  const [activeGuide, setActiveGuide] = useState(defaultGuide);
  const guide = GUIDES[activeGuide];

  return (
    <Box bg="rgba(15,20,40,0.8)" border="1px solid rgba(229,62,62,0.3)" borderRadius="24px" p={6} mt={4} backdropFilter="blur(10px)">
      <HStack mb={4} justify="space-between" flexWrap="wrap" gap={3}>
        <HStack>
          <Box p={2} bg="rgba(229,62,62,0.15)" borderRadius="12px">
            <MdLocalHospital color="#e53e3e" size={24} />
          </Box>
          <Text fontSize="lg" fontWeight="800" color="white">Live First-Aid Assist</Text>
        </HStack>
        <HStack>
          {Object.entries(GUIDES).map(([key, data]) => (
            <Button
              key={key}
              size="sm"
              variant={activeGuide === key ? 'solid' : 'outline'}
              colorScheme={data.color.split('.')[0]}
              onClick={() => setActiveGuide(key)}
              leftIcon={<data.icon />}
            >
              {data.title}
            </Button>
          ))}
        </HStack>
      </HStack>

      <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="center">
        {/* Metronome Visualizer */}
        {activeGuide === 'cpr' ? (
          <Flex direction="column" align="center" justify="center" minW="150px">
            <Box
              w="100px"
              h="100px"
              bg="rgba(229,62,62,0.2)"
              border="2px solid #e53e3e"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              animation={prefersReducedMotion ? undefined : pulseAnimation}
            >
              <Icon as={MdFavorite} color="red.400" size={40} w={10} h={10} />
            </Box>
            <Text mt={4} fontWeight="700" color="red.300" letterSpacing="1px">100 BPM</Text>
            <Text fontSize="xs" color="whiteAlpha.500">Push to the beat</Text>
          </Flex>
        ) : (
          <Flex direction="column" align="center" justify="center" minW="150px">
             <Box
              w="100px"
              h="100px"
              bg="rgba(255,255,255,0.05)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={guide.icon} color={guide.color} size={40} w={10} h={10} />
            </Box>
          </Flex>
        )}

        {/* Instructions */}
        <VStack align="stretch" spacing={3} flex="1">
          <Text fontSize="md" fontWeight="bold" color={guide.color}>{guide.title} Instructions</Text>
          {guide.instructions.map((inst, idx) => (
            <Box key={idx} bg="rgba(255,255,255,0.03)" p={3} borderRadius="12px">
              <Text fontSize="sm" color="whiteAlpha.800">{inst}</Text>
            </Box>
          ))}
        </VStack>
      </Flex>
    </Box>
  );
};

export default FirstAidGuide;
