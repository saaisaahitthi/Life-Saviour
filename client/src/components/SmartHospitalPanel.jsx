import { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Badge, Icon, SimpleGrid,
  Progress, Flex, Spinner
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiTarget, FiAward, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import api from '../services/api';

const MotionBox = motion(Box);

const SmartHospitalPanel = ({ emergencyId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (emergencyId) fetchRecommendations();
  }, [emergencyId]);

  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get(`/hospital-recommend/recommend/${emergencyId}`);
      setData(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <Flex justify="center" py={4}><Spinner size="sm" color="brand.400" /></Flex>;
  if (!data || !data.recommendations.length) return null;

  const getConfidenceColor = (c) => c >= 70 ? '#38a169' : c >= 40 ? '#d69e2e' : '#e53e3e';
  const getSuitabilityBadge = (s) => s === 'excellent' ? 'green' : s === 'suitable' ? 'blue' : 'orange';

  return (
    <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Box bg="rgba(0,128,230,0.05)" border="1px solid rgba(0,128,230,0.15)" borderRadius="18px" p={5}>
        <HStack mb={4} justify="space-between">
          <HStack>
            <Icon as={FiTarget} color="brand.400" />
            <Text fontSize="xs" fontWeight="800" color="brand.300">AI HOSPITAL RECOMMENDATION</Text>
          </HStack>
          <Badge colorScheme="blue" variant="subtle" fontSize="8px">
            {data.emergencyType?.toUpperCase()} → {data.requiredSpecialization?.toUpperCase()}
          </Badge>
        </HStack>

        <VStack spacing={3} align="stretch">
          {data.recommendations.map((rec, i) => (
            <Box
              key={i}
              bg={i === 0 ? 'rgba(56,161,105,0.08)' : 'rgba(255,255,255,0.03)'}
              border={`1px solid ${i === 0 ? 'rgba(56,161,105,0.2)' : 'rgba(255,255,255,0.05)'}`}
              borderRadius="14px"
              p={4}
              position="relative"
              overflow="hidden"
            >
              {i === 0 && (
                <Box position="absolute" top={0} left={0} right={0} h="2px" bg="green.400" />
              )}
              <Flex justify="space-between" align="flex-start" mb={2}>
                <HStack spacing={2}>
                  <Box p={1.5} bg={i === 0 ? 'rgba(56,161,105,0.2)' : 'rgba(255,255,255,0.06)'} borderRadius="8px">
                    <Icon as={i === 0 ? FiAward : MdLocalHospital} color={i === 0 ? 'green.400' : 'whiteAlpha.500'} boxSize={3.5} />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="700" fontSize="sm">{rec.hospital?.name || 'Hospital'}</Text>
                    {i === 0 && <Text fontSize="9px" color="green.400" fontWeight="700">BEST MATCH</Text>}
                  </VStack>
                </HStack>
                <Badge colorScheme={getSuitabilityBadge(rec.suitability)} fontSize="8px">{rec.suitability}</Badge>
              </Flex>

              {/* Confidence Bar */}
              <HStack spacing={2} mb={2}>
                <Text fontSize="9px" color="whiteAlpha.400" w="60px">AI Score</Text>
                <Progress
                  value={rec.confidence}
                  size="xs"
                  flex={1}
                  colorScheme={rec.confidence >= 70 ? 'green' : rec.confidence >= 40 ? 'yellow' : 'red'}
                  bg="whiteAlpha.100"
                  borderRadius="full"
                />
                <Text fontSize="10px" fontWeight="800" color={getConfidenceColor(rec.confidence)}>{rec.confidence}%</Text>
              </HStack>

              {/* Factors */}
              <HStack spacing={1} flexWrap="wrap">
                {rec.factors.map((f, j) => (
                  <Badge key={j} fontSize="7px" variant="outline" colorScheme="whiteAlpha" px={1.5} py={0.5} borderRadius="4px">
                    {f}
                  </Badge>
                ))}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default SmartHospitalPanel;
